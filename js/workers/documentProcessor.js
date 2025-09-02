/**
 * SITEWEAVE DOCUMENT PROCESSOR WORKER
 *
 * This web worker offloads heavy document processing tasks from the
 * main UI thread. It handles PDF text extraction via pdf.js, OCR
 * operations using Tesseract.js and basic content parsing to reduce
 * UI blocking during uploads. The worker reports progress back to
 * the main thread and returns an array of sections on completion.
 */

/* global pdfjsLib, Tesseract */

// Import dependencies. These are loaded from public CDNs since the
// worker has no access to modules defined in the main window. If
// importScripts fails (e.g. network blocked), the worker will
// terminate with an error and the main thread will fall back to
// synchronous processing.
try {
    importScripts('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js');
    importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js');
} catch (err) {
    // Forward the error to the main thread.  If libraries fail to
    // load, the worker cannot process documents.
    self.postMessage({ type: 'error', error: 'Failed to load worker dependencies: ' + err.message });
}

/**
 * Send a progress update to the main thread. The main thread can
 * optionally consume the `step`, `progress` and `message` fields to
 * update a loading UI. Progress should range from 0 to 1.
 *
 * @param {string} step Short title for the current step
 * @param {number} progress Progress as a fraction between 0 and 1
 * @param {string} message Detailed message for the user
 */
function postProgress(step, progress, message) {
    self.postMessage({ type: 'progress', step, progress, message });
}

/**
 * Extract text from a PDF using pdf.js. Returns the full text and
 * the ratio of alphabetic to non‑whitespace characters. The caller
 * may use the ratio to decide whether OCR fallback is required.
 *
 * @param {Uint8Array} uint8 PDF data
 * @returns {Promise<{ fullText: string, alphaRatio: number, numPages: number }>} Extracted text and metrics
 */
async function extractTextFromPDFBuffer(uint8) {
    const loadingTask = pdfjsLib.getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;
    let fullText = '';
    const numPages = pdf.numPages;
    for (let i = 1; i <= numPages; i++) {
        postProgress(`Extracting page ${i}`, 0.1 + (i - 1) * (0.4 / numPages), `Extracting text from page ${i} of ${numPages}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = '';
        let lastY = null;
        textContent.items.forEach(item => {
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                pageText += '\n';
            }
            pageText += item.str + ' ';
            lastY = item.transform[5];
        });
        fullText += pageText + '\n\n';
    }
    const alphaMatches = fullText.match(/[A-Za-z]/g) || [];
    const nonSpaceLength = fullText.replace(/\s+/g, '').length;
    const alphaRatio = nonSpaceLength > 0 ? alphaMatches.length / nonSpaceLength : 0;
    return { fullText, alphaRatio, numPages };
}

/**
 * Perform OCR on each page of a PDF. Renders pages to an
 * OffscreenCanvas and uses Tesseract.js to recognise text. Progress
 * updates are emitted for each page and within OCR processing.
 *
 * @param {Uint8Array} uint8 PDF data
 * @returns {Promise<string>} Combined OCR text
 */
async function performOCROnPDF(uint8) {
    const loadingTask = pdfjsLib.getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let combined = '';
    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        // OffscreenCanvas is supported in most modern browsers and in
        // workers. If unavailable, this may throw and the main thread
        // will handle the error.
        const canvas = new OffscreenCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
        // Recognise text with progress reporting
        const ocrResult = await Tesseract.recognize(dataUrl, undefined, {
            logger: m => {
                if (typeof m.progress === 'number') {
                    const base = 0.5 + (i - 1) * (0.5 / numPages);
                    const progress = base + m.progress * (0.5 / numPages);
                    postProgress(`Reading page ${i}`, progress, `Reading text on page ${i}...`);
                }
            }
        });
        combined += (ocrResult.data && ocrResult.data.text ? ocrResult.data.text : '') + '\n\n';
    }
    return combined;
}

/**
 * Escape HTML entities to prevent injection. Used by the parser when
 * converting plain text into safe HTML fragments.
 *
 * @param {string} str Input string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
              .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

/**
 * Format an array of lines into HTML paragraphs and lists. Detects
 * ordered and unordered lists, emphasises all‑caps lines as bold and
 * escapes content to prevent HTML injection.
 *
 * @param {string[]} lines Lines of text
 * @returns {string} HTML string
 */
function formatContentLines(lines) {
    const items = [];
    let currentList = null;
    let currentParagraph = [];
    const flushParagraph = () => {
        if (currentParagraph.length > 0) {
            items.push({ type: 'p', text: currentParagraph.join(' ') });
            currentParagraph = [];
        }
    };
    const flushList = () => {
        if (currentList) {
            items.push(currentList);
            currentList = null;
        }
    };
    lines.forEach(line => {
        if (/^\s*$/.test(line)) {
            flushParagraph();
            flushList();
            return;
        }
        let match;
        // Unordered list bullets (hyphen, asterisk, or bullet)
        if ((match = line.match(/^\s*[-•*]\s*(.+)/))) {
            if (!currentList || currentList.listType !== 'ul') {
                flushParagraph();
                flushList();
                currentList = { listType: 'ul', items: [] };
            }
            currentList.items.push(match[1].trim());
        } else if ((match = line.match(/^\s*(\d+)[\)\.\-]\s*(.+)/))) {
            if (!currentList || currentList.listType !== 'ol') {
                flushParagraph();
                flushList();
                currentList = { listType: 'ol', items: [] };
            }
            currentList.items.push(match[2].trim());
        } else {
            flushList();
            currentParagraph.push(line);
        }
    });
    flushParagraph();
    flushList();
    // Convert items to HTML
    let html = '';
    items.forEach(item => {
        if (item.listType) {
            const tag = item.listType === 'ul' ? 'ul' : 'ol';
            html += `<${tag}>` + item.items.map(it => `<li>${escapeHtml(it)}</li>`).join('') + `</${tag}>`;
        } else if (item.type === 'p') {
            const text = item.text;
            const letters = text.replace(/[^A-Za-z]/g, '');
            const uppercaseLetters = text.replace(/[^A-Z]/g, '');
            const ratio = letters.length > 0 ? uppercaseLetters.length / letters.length : 0;
            if (ratio > 0.7 && text.length < 200) {
                html += `<p><strong>${escapeHtml(text)}</strong></p>`;
            } else {
                html += `<p>${escapeHtml(text)}</p>`;
            }
        }
    });
    return html;
}

/**
 * Enhanced text parser that recognises common section headers (both
 * academic and business), numbered headings and splits content
 * accordingly. If no headers are detected, returns a single content
 * section. Each section receives a unique id.
 *
 * @param {string} text Plain text to parse
 * @param {string} fileName Original file name (for header title)
 * @returns {Array} Array of section objects
 */
function enhancedParseTextIntoSections(text, fileName) {
    const sections = [];
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    // Always start with a header section
    sections.push({
        id: 'header',
        icon: '📄',
        name: 'Header',
        isHeader: true,
        content: [ { type: 'text', value: `<h1>${escapeHtml(cleanFileName)}</h1>`, allowHtml: false } ]
    });
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    let currentSection = null;
    let currentContent = [];
    // Known header patterns
    const headerPatterns = [
        'abstract','introduction','background','methods','methodology',
        'results','discussion','conclusion','references','acknowledgments',
        'summary','objectives','materials','analysis','findings',
        'recommendations','future work','limitations','appendix',
        'overview','approach','implementation','evaluation','related work',
        'executive summary','business objectives','scope','goals','purpose'
    ];
    const toTitleCase = str => str.charAt(0).toUpperCase() + str.slice(1);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        const lowerLine = line.toLowerCase();
        let headerCandidate = null;
        // Check numbered headings, e.g. "1. Introduction" or "2 Methodology"
        const numMatch = line.match(/^\d+\.?\s+(.+)/);
        if (numMatch) {
            headerCandidate = numMatch[1].trim();
        } else {
            // Check if line starts with a known header pattern
            headerCandidate = headerPatterns.find(h => lowerLine.startsWith(h));
        }
        if (headerCandidate) {
            // Save previous section
            if (currentSection && currentContent.length > 0) {
                currentSection.content.push({
                    type: 'text',
                    value: formatContentLines(currentContent),
                    allowHtml: false
                });
                sections.push(currentSection);
            }
            // Start new section
            const cleanHeader = headerCandidate.replace(/^\d+\.?\s*/, '').trim();
            currentSection = {
                id: cleanHeader.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now() + '-' + Math.random().toString(36).substr(2,4),
                icon: '📄',
                name: toTitleCase(cleanHeader),
                isHeader: false,
                content: []
            };
            currentContent = [];
        } else {
            currentContent.push(line);
        }
    }
    // Save the last section
    if (currentSection && currentContent.length > 0) {
        currentSection.content.push({
            type: 'text',
            value: formatContentLines(currentContent),
            allowHtml: false
        });
        sections.push(currentSection);
    }
    // If only header exists, add a generic content section
    if (sections.length === 1 && lines.length > 0) {
        sections.push({
            id: 'content-' + Date.now(),
            icon: '📄',
            name: 'Content',
            isHeader: false,
            content: [ { type: 'text', value: formatContentLines(lines), allowHtml: false } ]
        });
    }
    return sections;
}

// Main worker message handler
self.onmessage = async function(e) {
    const { id, type, fileType, fileData, fileName } = e.data || {};
    if (type !== 'processDocument') return;
    try {
        if (fileType === 'pdf') {
            const uint8 = new Uint8Array(fileData);
            // First, attempt native text extraction
            const { fullText, alphaRatio } = await extractTextFromPDFBuffer(uint8);
            let text = fullText;
            // Heuristic: if the text contains fewer than 50% letters or is very short, fallback to OCR
            if (alphaRatio < 0.5 || fullText.replace(/\s+/g, '').length < 100) {
                postProgress('Fallback OCR', 0.5, 'Low quality text detected. Performing OCR...');
                text = await performOCROnPDF(uint8);
            }
            const sections = enhancedParseTextIntoSections(text, fileName);
            self.postMessage({ type: 'result', id, sections });
        } else if (fileType === 'image') {
            // Convert ArrayBuffer to DataURL
            const blob = new Blob([fileData]);
            const dataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
            // Run OCR on the image
            const ocrResult = await Tesseract.recognize(dataUrl, undefined, {
                logger: m => {
                    if (typeof m.progress === 'number') {
                        const progress = 0.2 + m.progress * 0.6;
                        postProgress('Reading image', progress, 'Reading text from image...');
                    }
                }
            });
            const text = (ocrResult.data && ocrResult.data.text) ? ocrResult.data.text : '';
            const sections = enhancedParseTextIntoSections(text, fileName);
            self.postMessage({ type: 'imageResult', id, sections, dataUrl });
        }
    } catch (error) {
        self.postMessage({ type: 'error', id, error: error.message || String(error) });
    }
};