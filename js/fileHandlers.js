/**
 * SITEWEAVE - FILE HANDLERS
 * File upload and processing logic for PDF, PowerPoint, text, images, and future formats
 */

// ===================================================
// FILE HANDLING ORCHESTRATOR
// ===================================================

/**
 * Main file handler that routes to appropriate processor
 */
function handleFile(file, onSuccess, onError) {
    if (!file) {
        onError('No file provided');
        return;
    }

    // Validate file type
    if (!isValidFileType(file)) {
        onError('Unsupported file format. Please use PDF, PowerPoint, Text, or Image files.');
        return;
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    try {
        switch (fileExtension) {
            case 'pdf':
                handlePDF(file, onSuccess, onError);
                break;
            case 'pptx':
                handlePPTX(file, onSuccess, onError);
                break;
            case 'docx':
                handleDOCX(file, onSuccess, onError);
                break;
            case 'txt':
                handleText(file, onSuccess, onError);
                break;
            case 'md':
                handleMarkdown(file, onSuccess, onError);
                break;
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
            case 'svg':
            case 'tiff':
                handleImage(file, onSuccess, onError);
                break;
            default:
                onError('Unsupported file format: ' + fileExtension);
        }
    } catch (error) {
        console.error('File handling error:', error);
        onError('Failed to process file: ' + error.message);
    }
}

// ===================================================
// PDF PROCESSING
// ===================================================

/**
 * Handle PDF file upload and text extraction
 */
function handlePDF(file, onSuccess, onError) {
    // If Web Workers are supported, delegate heavy processing to the
    // documentProcessor worker. This prevents the UI from blocking
    // during large file processing. If worker initialization fails or
    // the browser does not support workers, fall back to the main
    // thread implementation.
    if (window.Worker) {
        try {
            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                // Initialize worker
                const worker = new Worker('js/workers/documentProcessor.js');
                const workerId = Date.now();
                const cleanup = () => {
                    try { worker.terminate(); } catch (err) { /* noop */ }
                };
                worker.onmessage = function(event) {
                    const data = event.data || {};
                    // Route progress updates to the loading UI
                    if (data.type === 'progress') {
                        if (typeof window.updateLoadingProgress === 'function') {
                            const step = data.step || 'Processing';
                            const progress = typeof data.progress === 'number' ? data.progress : 0;
                            const message = data.message || '';
                            window.updateLoadingProgress(step, progress, message);
                        }
                        return;
                    }
                    // Only handle messages matching our id
                    if (data.id !== workerId) return;
                    if (data.type === 'result' && Array.isArray(data.sections)) {
                        // Success: return sections
                        cleanup();
                        // Update progress for final step
                        if (typeof window.updateLoadingProgress === 'function') {
                            window.updateLoadingProgress('Creating website', 0.95, 'Creating website...');
                        }
                        onSuccess(data.sections, file.name);
                    } else if (data.type === 'error') {
                        console.error('Worker error:', data.error);
                        cleanup();
                        // Fallback to main thread processing on error
                        processPDFMainThread(file, onSuccess, onError);
                    } else if (data.type === 'imageResult') {
                        // Not used for PDF; ignore
                        cleanup();
                        processPDFMainThread(file, onSuccess, onError);
                    }
                };
                worker.onerror = function(err) {
                    console.error('Worker failed:', err);
                    cleanup();
                    processPDFMainThread(file, onSuccess, onError);
                };
                // Send file to worker
                worker.postMessage({ id: workerId, type: 'processDocument', fileType: 'pdf', fileData: arrayBuffer, fileName: file.name });
            };
            reader.onerror = function() {
                processPDFMainThread(file, onSuccess, onError);
            };
            reader.readAsArrayBuffer(file);
        } catch (err) {
            console.error('Worker setup error:', err);
            // Fallback to main thread processing
            processPDFMainThread(file, onSuccess, onError);
        }
    } else {
        // Workers not supported; use main thread
        processPDFMainThread(file, onSuccess, onError);
    }
}

/**
 * Main thread PDF processor. This function retains the previous
 * synchronous implementation of handlePDF for browsers that do not
 * support Web Workers or when the worker fails. It extracts text
 * using pdf.js, evaluates the quality of extraction and falls back
 * to OCR via Tesseract.js if necessary. Progress updates are
 * emitted via window.updateLoadingProgress.
 *
 * @param {File} file The PDF file to process
 * @param {function(Array, string)} onSuccess Callback with sections and filename
 * @param {function(string)} onError Callback on error
 */
function processPDFMainThread(file, onSuccess, onError) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            // Update progress: extracting text
            if (typeof window.updateLoadingProgress === 'function') {
                window.updateLoadingProgress('Extracting text', 0.3, 'Extracting text from PDF...');
            }
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) });
            loadingTask.promise.then(function(pdf) {
                _extractTextFromPDF(pdf, file.name)
                    .then(async ({ sections, fullText, alphaRatio }) => {
                        try {
                            // Update progress: analyzing sections
                            if (typeof window.updateLoadingProgress === 'function') {
                                window.updateLoadingProgress('Analyzing sections', 0.6, 'Analyzing document structure...');
                            }
                            // If text quality is poor, fallback to OCR
                            const poorQuality = (alphaRatio < 0.5) || (fullText.replace(/\s+/g, '').length < 100);
                            if (poorQuality) {
                                if (typeof window.updateLoadingProgress === 'function') {
                                    window.updateLoadingProgress('Fallback OCR', 0.3, 'Low quality text detected. Performing OCR...');
                                }
                                try {
                                    const ocrSections = await performOCRFallback(file);
                                    if (typeof window.updateLoadingProgress === 'function') {
                                        window.updateLoadingProgress('Creating website', 0.9, 'Creating website...');
                                    }
                                    onSuccess(ocrSections, file.name);
                                } catch (ocrError) {
                                    console.error('OCR fallback error:', ocrError);
                                    if (typeof window.updateLoadingProgress === 'function') {
                                        window.updateLoadingProgress('Creating website', 0.9, 'Creating website...');
                                    }
                                    onSuccess(sections, file.name);
                                }
                            } else {
                                if (typeof window.updateLoadingProgress === 'function') {
                                    window.updateLoadingProgress('Creating website', 0.9, 'Creating website...');
                                }
                                onSuccess(sections, file.name);
                            }
                        } catch (innerErr) {
                            console.error('PDF post-processing error:', innerErr);
                            if (typeof window.updateLoadingProgress === 'function') {
                                window.updateLoadingProgress('Creating website', 0.9, 'Creating website...');
                            }
                            onSuccess(sections, file.name);
                        }
                    })
                    .catch(error => {
                        console.error('PDF extraction error:', error);
                        onError('Failed to extract text from PDF: ' + error.message);
                    });
            }).catch(function(reason) {
                console.error('Error loading PDF:', reason);
                createBasicSections(file.name, onSuccess);
            });
        } catch (error) {
            console.error('PDF processing error:', error);
            createBasicSections(file.name, onSuccess);
        }
    };
    reader.onerror = function() {
        onError('Failed to read PDF file');
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Extract text from all pages of a PDF
 */
async function _extractTextFromPDF(pdf, fileName) {
    let fullText = '';
    // Extract text from each page of the PDF.  We accumulate a
    // single string `fullText` which will later be used to assess
    // extraction quality.  PDF.js occasionally inserts strange
    // characters or whitespace; we normalise by joining items with a
    // space and inserting a newline when the y‑coordinate jumps.
    for (let i = 1; i <= pdf.numPages; i++) {
        try {
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
        } catch (error) {
            console.error(`Error extracting text from page ${i}:`, error);
        }
    }
    // Compute a simple quality metric.  We count the number of
    // alphabetic characters and compare to the total number of
    // non‑whitespace characters.  If there are very few letters
    // relative to symbols or whitespace, this suggests the PDF
    // contains mostly images or scanned content.  The ratio will be
    // used by the caller to decide whether to fall back to OCR.
    const alphaMatches = fullText.match(/[A-Za-z]/g) || [];
    const nonSpaceLength = fullText.replace(/\s+/g, '').length;
    const alphaRatio = nonSpaceLength > 0 ? (alphaMatches.length / nonSpaceLength) : 0;
    // Parse into sections using the existing heuristic
    const sections = parseTextIntoSections(fullText, fileName);
    return { sections, fullText, alphaRatio };
}

/**
 * Wrapper around the internal PDF text extraction function that
 * preserves the original API.  Historically, extractTextFromPDF
 * returned an array of sections only.  The internal
 * implementation now returns additional metadata (the raw text
 * and a quality score).  This wrapper unwraps the object and
 * returns just the sections array to maintain compatibility with
 * existing callers.
 *
 * @param {Object} pdf PDF document returned from pdfjsLib.getDocument().promise
 * @param {string} fileName The file name being processed
 * @returns {Promise<Array>} Array of section objects
 */
async function extractTextFromPDF(pdf, fileName) {
    const { sections } = await _extractTextFromPDF(pdf, fileName);
    return sections;
}

/**
 * Perform an OCR fallback for scanned PDFs using Tesseract.js.
 * This method renders each page of the PDF onto an off‑screen
 * canvas and then feeds the resulting image into Tesseract.js to
 * extract the text.  Progress updates are emitted via
 * window.updateLoadingProgress if available.  The aggregated text
 * is then parsed into sections using the existing parsing
 * heuristics.
 *
 * @param {File} file The original PDF file supplied by the user
 * @returns {Promise<Array>} A promise resolving to an array of sections
 */
async function performOCRFallback(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const uint8 = new Uint8Array(e.target.result);
                const loadingTask = pdfjsLib.getDocument({ data: uint8 });
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;
                let combinedText = '';
                for (let i = 1; i <= numPages; i++) {
                    try {
                        // Emit progress: rendering page
                        if (typeof window.updateLoadingProgress === 'function') {
                            const base = 0.3; // base progress when OCR fallback starts
                            const fraction = 0.6 / numPages; // allocate 60% of progress to OCR
                            const progress = base + (i - 1) * fraction;
                            window.updateLoadingProgress(`Rendering page ${i}`, progress, `Rendering page ${i} of ${numPages}...`);
                        }
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 });
                        // Create an offscreen canvas
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        // Render the page into the canvas
                        await page.render({ canvasContext: context, viewport: viewport }).promise;
                        const dataURL = canvas.toDataURL('image/png');
                        // Recognize text using Tesseract.js
                        if (typeof window.LWB_OCR !== 'undefined' && typeof window.LWB_OCR.processWithTesseract === 'function') {
                            const ocrResult = await window.LWB_OCR.processWithTesseract(dataURL, {
                                logger: m => {
                                    if (typeof window.updateLoadingProgress === 'function') {
                                        const base = 0.3 + (i - 1) * (0.6 / numPages);
                                        const fraction = 0.6 / numPages;
                                        const progress = base + (m.progress || 0) * fraction;
                                        window.updateLoadingProgress('Reading text', progress, `Reading text on page ${i}...`);
                                    }
                                }
                            });
                            if (ocrResult && ocrResult.text) {
                                combinedText += ocrResult.text + '\n\n';
                            }
                        }
                    } catch (pageErr) {
                        console.error('OCR fallback page error:', pageErr);
                    }
                }
                // Parse aggregated text into sections
                const sections = window.LWB_FileHandlers.parseTextIntoSections(combinedText, file.name);
                resolve(sections);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = function(err) {
            reject(err);
        };
        reader.readAsArrayBuffer(file);
    });
}

// ===================================================
// POWERPOINT PROCESSING
// ===================================================

/**
 * Handle PowerPoint file upload and content extraction
 */
async function handlePPTX(file, onSuccess, onError) {
    try {
        if (typeof JSZip === 'undefined') {
            onError('PowerPoint processing library not loaded. Please refresh the page and try again.');
            return;
        }
        // Update progress: extracting slides
        if (typeof window.updateLoadingProgress === 'function') {
            window.updateLoadingProgress('Extracting slides', 0.4, 'Extracting slides...');
        }
        
        const zip = await JSZip.loadAsync(file);
        const slides = [];
        const slideFiles = [];
        
        // Find all slide files
        zip.folder("ppt/slides").forEach((relativePath, file) => {
            if (relativePath.match(/slide\d+\.xml$/)) {
                slideFiles.push({
                    name: relativePath,
                    order: parseInt(relativePath.match(/\d+/)[0])
                });
            }
        });
        
        // Sort slides by order
        slideFiles.sort((a, b) => a.order - b.order);
        
        // Extract text from each slide
        for (const slideFile of slideFiles) {
            const slideXml = await zip.file(`ppt/slides/${slideFile.name}`).async("string");
            const slideText = extractTextFromSlideXML(slideXml);
            if (slideText.trim()) {
                slides.push({
                    order: slideFile.order,
                    text: slideText
                });
            }
        }
        
        // Also try to extract from presentation notes
        const notesFiles = [];
        try {
            zip.folder("ppt/notesSlides").forEach((relativePath, file) => {
                if (relativePath.match(/notesSlide\d+\.xml$/)) {
                    notesFiles.push({
                        name: relativePath,
                        order: parseInt(relativePath.match(/\d+/)[0])
                    });
                }
            });
        } catch (e) {
            // No notes folder
        }
        
        notesFiles.sort((a, b) => a.order - b.order);
        
        const notes = [];
        for (const noteFile of notesFiles) {
            try {
                const noteXml = await zip.file(`ppt/notesSlides/${noteFile.name}`).async("string");
                const noteText = extractTextFromSlideXML(noteXml);
                if (noteText.trim()) {
                    notes.push({
                        order: noteFile.order,
                        text: noteText
                    });
                }
            } catch (e) {
                // Skip problematic note files
            }
        }
        
        // Update progress: processing content
        if (typeof window.updateLoadingProgress === 'function') {
            window.updateLoadingProgress('Processing content', 0.7, 'Processing content...');
        }
        // Convert slides to sections
        const sections = convertPPTXToSections(slides, notes, file.name);
        // Update progress: creating website
        if (typeof window.updateLoadingProgress === 'function') {
            window.updateLoadingProgress('Creating website', 0.9, 'Creating website...');
        }
        onSuccess(sections, file.name);
        
    } catch (error) {
        console.error('PPTX processing error:', error);
        onError('Failed to process PowerPoint file. The file may be corrupted or in an unsupported format.');
    }
}

/**
 * Extract text content from slide XML
 */
function extractTextFromSlideXML(xml) {
    // Remove XML tags but preserve text content
    let text = '';
    
    // Extract text between <a:t> tags (PowerPoint text elements)
    const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
    if (textMatches) {
        text = textMatches
            .map(match => match.replace(/<[^>]*>/g, ''))
            .join(' ');
    }
    
    // Clean up the text
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x[0-9A-F]+;/gi, '') // Remove hex entities
        .replace(/\s+/g, ' ')
        .trim();
    
    return text;
}

/**
 * Convert PowerPoint slides to website sections
 */
function convertPPTXToSections(slides, notes, fileName) {
    const sections = [];
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    // Create header section
    if (slides.length > 0) {
        const firstSlide = slides[0];
        const isTitle = firstSlide.text.length < 200; // Likely a title slide if short
        
        if (isTitle) {
            sections.push({
                id: 'header',
                icon: '📊',
                name: 'Header',
                isHeader: true,
                content: [
                    { 
                        type: 'text', 
                        value: `<h1>${firstSlide.text || cleanFileName}</h1>`, 
                        allowHtml: false 
                    }
                ]
            });
            slides.shift(); // Remove first slide from array
        } else {
            // Create generic header
            sections.push({
                id: 'header',
                icon: '📊',
                name: 'Header',
                isHeader: true,
                content: [
                    { 
                        type: 'text', 
                        value: `<h1>${cleanFileName}</h1>`, 
                        allowHtml: false 
                    }
                ]
            });
        }
    } else {
        // Create default header if no slides
        sections.push({
            id: 'header',
            icon: '📊',
            name: 'Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: `<h1>${cleanFileName}</h1>`, 
                    allowHtml: false 
                }
            ]
        });
    }
    
    // Process remaining slides
    slides.forEach((slide, index) => {
        if (!slide.text.trim()) return;
        
        // Try to detect section headers (usually shorter text)
        const lines = slide.text.split(/[.!?]\s+/).filter(l => l.trim());
        let sectionName = 'Slide ' + (index + 2);
        let icon = '📄';
        
        // If first line is short, it might be a title
        if (lines[0] && lines[0].length < 50) {
            sectionName = lines[0].substring(0, 30).trim();
            
            // Try to assign appropriate icon based on content
            const lowerText = slide.text.toLowerCase();
            icon = detectSectionIcon(lowerText);
            sectionName = detectSectionName(lowerText, sectionName);
        }
        
        // Format the content
        let formattedContent = formatSlideContent(slide.text);
        
        // Add note content if available
        const noteForSlide = notes.find(n => n.order === slide.order);
        if (noteForSlide && noteForSlide.text) {
            formattedContent += `<hr><p><em>Speaker Notes: ${noteForSlide.text}</em></p>`;
        }
        
        sections.push({
            id: `slide-${slide.order}`,
            icon: icon,
            name: sectionName,
            content: [
                { 
                    type: 'text', 
                    value: formattedContent, 
                    allowHtml: false 
                }
            ]
        });
    });
    
    // If no sections were created, add a default one
    if (sections.length === 1) {
        sections.push({
            id: 'content',
            icon: '📄',
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: '<p>No text content could be extracted from this PowerPoint file. The file may contain primarily images or complex layouts.</p><p>You can still add your own content using the editor below.</p>', 
                    allowHtml: false 
                }
            ]
        });
    }
    
    return sections;
}

/**
 * Format slide content into HTML
 */
function formatSlideContent(text) {
    if (!text) return '<p></p>';
    
    // Split into sentences
    const sentences = text.split(/([.!?]\s+)/).filter(s => s.trim());
    
    // Group sentences into paragraphs (simple heuristic)
    let formatted = '<p>';
    sentences.forEach((sentence, index) => {
        formatted += sentence;
        // Add paragraph break after every 2-3 sentences or if sentence is very long
        if ((index + 1) % 3 === 0 || sentence.length > 150) {
            formatted += '</p><p>';
        }
    });
    formatted += '</p>';
    
    // Clean up empty paragraphs
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');
    
    return formatted || '<p>' + text + '</p>';
}

/**
 * Detect appropriate icon for section based on content
 */
function detectSectionIcon(text) {
    const iconMap = {
        'introduction': '📖',
        'overview': '📖',
        'objective': '🎯',
        'goal': '🎯',
        'method': '🔬',
        'result': '📊',
        'finding': '📊',
        'conclusion': '✅',
        'summary': '✅',
        'question': '❓',
        'q&a': '❓',
        'thank': '🙏',
        'reference': '📚',
        'bibliography': '📚',
        'contact': '📧',
        'background': '📚',
        'discussion': '💬',
        'analysis': '📈',
        'data': '📊',
        'recommendation': '💡',
        'future': '🔮',
        'challenge': '⚠️',
        'solution': '💡'
    };
    
    for (const [keyword, icon] of Object.entries(iconMap)) {
        if (text.includes(keyword)) {
            return icon;
        }
    }
    
    return '📄';
}

/**
 * Detect appropriate section name based on content
 */
function detectSectionName(text, defaultName) {
    const nameMap = {
        'introduction': 'Introduction',
        'overview': 'Overview',
        'objective': 'Objectives',
        'goal': 'Goals',
        'method': 'Methods',
        'result': 'Results',
        'finding': 'Findings',
        'conclusion': 'Conclusion',
        'summary': 'Summary',
        'question': 'Questions',
        'q&a': 'Q&A',
        'thank': 'Thank You',
        'reference': 'References',
        'bibliography': 'Bibliography',
        'contact': 'Contact',
        'background': 'Background',
        'discussion': 'Discussion',
        'analysis': 'Analysis',
        'data': 'Data',
        'recommendation': 'Recommendations',
        'future': 'Future Work',
        'challenge': 'Challenges',
        'solution': 'Solutions'
    };
    
    for (const [keyword, name] of Object.entries(nameMap)) {
        if (text.includes(keyword)) {
            return name;
        }
    }
    
    return defaultName;
}

// ===================================================
// DOCX PROCESSING (Basic implementation)
// ===================================================

/**
 * Handle DOCX file upload - basic implementation
 */
function handleDOCX(file, onSuccess, onError) {
    // For now, provide a helpful message and create basic sections
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    
    const sections = [
        {
            id: 'header',
            icon: '📝',
            name: 'Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: `<h1>${fileName}</h1>`, 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'content',
            icon: '📄',
            name: 'Document Content',
            content: [
                { 
                    type: 'text', 
                    value: '<p>Word document processing is coming soon!</p><p>For now, you can:</p><ul><li>Save your document as PDF and upload it</li><li>Copy and paste your content into a text file</li><li>Use the editor below to manually add your content</li></ul>', 
                    allowHtml: false 
                }
            ]
        }
    ];
    
    onSuccess(sections, file.name);
}

// ===================================================
// TEXT FILE PROCESSING
// ===================================================

/**
 * Handle plain text file upload
 */
function handleText(file, onSuccess, onError) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const sections = parseTextIntoSections(text, file.name);
            onSuccess(sections, file.name);
        } catch (error) {
            console.error('Text processing error:', error);
            onError('Failed to process text file');
        }
    };
    
    reader.onerror = function() {
        onError('Failed to read text file');
    };
    
    reader.readAsText(file);
}

/**
 * Handle Markdown file upload
 */
function handleMarkdown(file, onSuccess, onError) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const markdown = e.target.result;
            const sections = parseMarkdownIntoSections(markdown, file.name);
            onSuccess(sections, file.name);
        } catch (error) {
            console.error('Markdown processing error:', error);
            onError('Failed to process Markdown file');
        }
    };
    
    reader.onerror = function() {
        onError('Failed to read Markdown file');
    };
    
    reader.readAsText(file);
}

/**
 * Parse Markdown into sections
 */
function parseMarkdownIntoSections(markdown, fileName) {
    const sections = [];
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    // Split by headers
    const parts = markdown.split(/^#{1,3}\s+(.+)$/gm);
    
    // Create header section
    sections.push({
        id: 'header',
        icon: '📝',
        name: 'Header',
        isHeader: true,
        content: [
            { 
                type: 'text', 
                value: `<h1>${parts[1] || cleanFileName}</h1>`, 
                allowHtml: false 
            }
        ]
    });
    
    // Process remaining content
    for (let i = 2; i < parts.length; i += 2) {
        const heading = parts[i - 1];
        const content = parts[i];
        
        if (heading && content) {
            sections.push({
                id: `section-${i}`,
                icon: detectSectionIcon(heading.toLowerCase()),
                name: heading.substring(0, 30),
                content: [
                    { 
                        type: 'text', 
                        value: convertMarkdownToHtml(content), 
                        allowHtml: false 
                    }
                ]
            });
        }
    }
    
    // If no sections found, put all content in one section
    if (sections.length === 1) {
        sections.push({
            id: 'content',
            icon: '📄',
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: convertMarkdownToHtml(markdown), 
                    allowHtml: false 
                }
            ]
        });
    }
    
    return sections;
}

/**
 * Basic Markdown to HTML conversion
 */
function convertMarkdownToHtml(markdown) {
    let html = markdown
        // Bold
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        // Links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // Line breaks
        .replace(/\n\n/g, '</p><p>')
        // Lists
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Wrap in paragraph tags
    if (!html.startsWith('<')) {
        html = '<p>' + html + '</p>';
    }
    
    // Wrap list items in ul/ol tags
    html = html.replace(/(<li>.*<\/li>)+/g, '<ul>$&</ul>');
    
    return html;
}

// ===================================================
// IMAGE PROCESSING
// ===================================================

/**
 * Handle image file upload
 */
function handleImage(file, onSuccess, onError) {
    // Validate image size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        onError('Image file too large. Please use an image smaller than 10MB.');
        return;
    }
    // Update progress: preparing image
    if (typeof window.updateLoadingProgress === 'function') {
        window.updateLoadingProgress('Preparing image', 0.2, 'Preparing image...');
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const dataUrl = e.target.result;
            // Perform OCR using Tesseract.js on the image
            let ocrText = '';
            let ocrConfidence = 0;
            try {
                if (typeof window.LWB_OCR !== 'undefined' && typeof window.LWB_OCR.processWithTesseract === 'function') {
                    const ocrResult = await window.LWB_OCR.processWithTesseract(dataUrl, {
                        logger: m => {
                            if (typeof window.updateLoadingProgress === 'function') {
                                // Allocate 50% of progress for OCR (from 0.2 to 0.7)
                                const progress = 0.2 + (m.progress || 0) * 0.5;
                                window.updateLoadingProgress('Reading text', progress, 'Reading text from image...');
                            }
                        }
                    });
                    if (ocrResult && ocrResult.text) {
                        ocrText = ocrResult.text.trim();
                        ocrConfidence = ocrResult.confidence || 0;
                    }
                }
            } catch (ocrErr) {
                console.error('Image OCR error:', ocrErr);
            }
            // Determine whether to use OCR text based on confidence and length
            if (ocrText && ocrText.length > 20) {
                // Create sections with extracted text and image
                if (typeof window.updateLoadingProgress === 'function') {
                    window.updateLoadingProgress('Processing content', 0.8, 'Processing content...');
                }
                const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
                const textSections = window.LWB_FileHandlers.parseTextIntoSections(ocrText, file.name);
                // Prepend header and image sections similar to createImagePosterSections
                const headerSection = {
                    id: 'header',
                    icon: '🖼️',
                    name: 'Header',
                    isHeader: true,
                    content: [ { type: 'text', value: `<h1>${cleanFileName}</h1>`, allowHtml: false } ]
                };
                const imageSection = {
                    id: 'image-section',
                    icon: '📷',
                    name: 'Poster Image',
                    isHeader: false,
                    content: [ { type: 'image', url: dataUrl, caption: 'Original image' } ]
                };
                const allSections = [ headerSection, imageSection ];
                // Append OCR text sections (mark them as non-header)
                textSections.forEach((sec, idx) => {
                    // Avoid duplicating header
                    if (sec.isHeader) return;
                    // For OCR text sections, keep the icon and name
                    allSections.push({
                        id: `ocr-${idx}`,
                        icon: sec.icon || '📝',
                        name: sec.name || `Text ${idx + 1}`,
                        isHeader: false,
                        content: sec.content
                    });
                });
                onSuccess(allSections, file.name);
            } else {
                // Fallback to original image poster sections
                const sections = createImagePosterSections(dataUrl, file.name);
                onSuccess(sections, file.name);
            }
        } catch (error) {
            console.error('Image processing error:', error);
            onError('Failed to process image file');
        }
    };
    reader.onerror = function() {
        onError('Failed to read image file');
    };
    reader.readAsDataURL(file);
}

/**
 * Create sections for an image-based poster
 */
function createImagePosterSections(imageDataUrl, fileName) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    return [
        {
            id: 'header',
            icon: '🖼️',
            name: 'Header',
            isHeader: true,
            content: [
                { type: 'text', value: `<h1>${cleanFileName}</h1>`, allowHtml: false }
            ]
        },
        {
            id: 'image-section',
            icon: '📷',
            name: 'Poster Image',
            isHeader: false,
            content: [
                { 
                    type: 'image', 
                    url: imageDataUrl, 
                    caption: 'Click the image above to upload a different one, or add more sections below.'
                }
            ]
        },
        {
            id: 'description',
            icon: '📝',
            name: 'Description',
            isHeader: false,
            content: [
                { 
                    type: 'text', 
                    value: '<p>Add a description of your image here. You can edit this text or add more sections using the editor.</p>', 
                    allowHtml: false 
                }
            ]
        }
    ];
}

/**
 * Parse text into sections intelligently
 */
function parseTextIntoSections(text, fileName) {
    const sections = [];
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    // Common section headers to look for
    const sectionHeaders = [
        'abstract', 'introduction', 'background', 'methods', 'methodology',
        'results', 'discussion', 'conclusion', 'references', 'acknowledgments',
        'summary', 'objectives', 'materials', 'analysis', 'findings',
        'recommendations', 'future work', 'limitations', 'appendix'
    ];
    
    // Create header section
    sections.push({
        id: 'header',
        icon: '📄',
        name: 'Header',
        isHeader: true,
        content: [
            { 
                type: 'text', 
                value: `<h1>${cleanFileName}</h1>`, 
                allowHtml: false 
            }
        ]
    });
    
    // Split text into lines
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    let currentSection = null;
    let currentContent = [];
    
    for (const line of lines) {
        const lowerLine = line.toLowerCase().trim();
        
        // Check if this line is a section header
        const matchedHeader = sectionHeaders.find(header => {
            return lowerLine.startsWith(header) || 
                   lowerLine === header ||
                   lowerLine.includes(header + ':');
        });
        
        if (matchedHeader) {
            // Save previous section if exists
            if (currentSection && currentContent.length > 0) {
                currentSection.content.push({
                    type: 'text',
                    value: '<p>' + currentContent.join('</p><p>') + '</p>',
                    allowHtml: false
                });
                sections.push(currentSection);
            }
            
            // Start new section
            currentSection = {
                id: matchedHeader.replace(/\s+/g, '-'),
                icon: detectSectionIcon(matchedHeader),
                name: matchedHeader.charAt(0).toUpperCase() + matchedHeader.slice(1),
                content: []
            };
            currentContent = [];
        } else if (line.trim()) {
            // Add line to current content
            currentContent.push(line.trim());
        }
    }
    
    // Save last section
    if (currentSection && currentContent.length > 0) {
        currentSection.content.push({
            type: 'text',
            value: '<p>' + currentContent.join('</p><p>') + '</p>',
            allowHtml: false
        });
        sections.push(currentSection);
    }
    
    // If no sections were detected, put all content in one section
    if (sections.length === 1) {
        const allContent = lines.join('</p><p>');
        sections.push({
            id: 'content',
            icon: '📄',
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: '<p>' + allContent + '</p>', 
                    allowHtml: false 
                }
            ]
        });
    }
    
    return sections;
}

/**
 * Create basic sections when processing fails
 */
function createBasicSections(fileName, onSuccess) {
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    const sections = [
        {
            id: 'header',
            icon: '📄',
            name: 'Header',
            isHeader: true,
            content: [
                { 
                    type: 'text', 
                    value: `<h1>${cleanFileName}</h1>`, 
                    allowHtml: false 
                }
            ]
        },
        {
            id: 'content',
            icon: '📝',
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: '<p>We couldn\'t extract text from your file automatically, but you can still use the editor to add your content!</p><p>Use the tools below to:</p><ul><li>Add text sections</li><li>Upload images</li><li>Format your content</li><li>Customize the design</li></ul>', 
                    allowHtml: false 
                }
            ]
        }
    ];
    
    onSuccess(sections, fileName);
}

// ===================================================
// DRAG & DROP HANDLING
// ===================================================

/**
 * Initialize drag and drop functionality for a drop zone
 */
function initializeDragAndDrop(dropZoneElement, onFileDropped) {
    if (!dropZoneElement) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop zone when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, () => {
            dropZoneElement.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZoneElement.addEventListener(eventName, () => {
            dropZoneElement.classList.remove('drag-over');
        }, false);
    });
    
    // Handle dropped files
    dropZoneElement.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            onFileDropped(files[0]);
        }
    }
}

// ===================================================
// FILE VALIDATION
// ===================================================

/**
 * Check if file type is valid
 */
function isValidFileType(file) {
    const allowedTypes = ['pdf', 'pptx', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'tiff'];
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
}

/**
 * Validate file before processing
 */
function validateFile(file) {
    const errors = [];
    
    if (!file) {
        errors.push('No file selected');
        return errors;
    }
    
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        errors.push('File too large. Maximum size is 50MB.');
    }
    
    // Check file type
    if (!isValidFileType(file)) {
        const extension = file.name.split('.').pop().toLowerCase();
        errors.push(`Unsupported file type: .${extension}. Please use PDF, PowerPoint, Text, or Image files.`);
    }
    
    // Check file name
    if (file.name.length > 255) {
        errors.push('File name too long');
    }
    
    return errors;
}

// ===================================================
// EXPORTS
// ===================================================

// Make functions available globally for the modular system
window.LWB_FileHandlers = {
    // Main handler
    handleFile,
    
    // Specific handlers
    handlePDF,
    handlePPTX,
    handleDOCX,
    handleText,
    handleMarkdown,
    handleImage,
    
    // Utilities
    initializeDragAndDrop,
    validateFile,
    isValidFileType,
    createImagePosterSections,
    extractTextFromPDF,
    extractTextFromSlideXML,
    convertPPTXToSections,
    parseTextIntoSections,
    parseMarkdownIntoSections,
    createBasicSections,
    
    // Helper functions
    detectSectionIcon,
    detectSectionName,
    formatSlideContent,
    convertMarkdownToHtml
};