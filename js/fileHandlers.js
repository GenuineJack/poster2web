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
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) });
            
            loadingTask.promise.then(function(pdf) {
                extractTextFromPDF(pdf, file.name)
                    .then(sections => {
                        console.log('PDF sections extracted:', sections);
                        onSuccess(sections, file.name);
                    })
                    .catch(error => {
                        console.error('PDF extraction error:', error);
                        onError('Failed to extract text from PDF: ' + error.message);
                    });
            }).catch(function(reason) {
                console.error('Error loading PDF:', reason);
                // Fallback to basic processing
                createBasicSections(file.name, onSuccess);
            });
        } catch (error) {
            console.error('PDF processing error:', error);
            // Fallback to basic processing
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
async function extractTextFromPDF(pdf, fileName) {
    let fullText = '';
    const pageTexts = [];
    
    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Build page text with proper spacing
            let pageText = '';
            let lastY = null;
            
            textContent.items.forEach(item => {
                // Add line break if Y position changed significantly
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str + ' ';
                lastY = item.transform[5];
            });
            
            pageTexts.push(pageText);
            fullText += pageText + '\n\n';
        } catch (error) {
            console.error(`Error extracting text from page ${i}:`, error);
        }
    }
    
    // Parse the extracted text into sections
    return parseTextIntoSections(fullText, fileName);
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
        
        // Convert slides to sections
        const sections = convertPPTXToSections(slides, notes, file.name);
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
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const sections = createImagePosterSections(e.target.result, file.name);
            onSuccess(sections, file.name);
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