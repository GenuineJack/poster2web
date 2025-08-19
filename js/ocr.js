/**
 * SITEWEAVE - OCR MODULE
 * Optical Character Recognition integration for image processing
 * Currently a placeholder for future Google Vision API integration
 */

// ===================================================
// CONFIGURATION
// ===================================================

const OCR_CONFIG = {
    // Google Vision API endpoint
    GOOGLE_VISION_API_URL: 'https://vision.googleapis.com/v1/images:annotate',
    
    // API key (should be stored securely, not in code)
    API_KEY: null,
    
    // Maximum image size for OCR (in bytes)
    MAX_IMAGE_SIZE: 20 * 1024 * 1024, // 20MB
    
    // Supported image formats
    SUPPORTED_FORMATS: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/tiff'],
    
    // OCR confidence threshold
    CONFIDENCE_THRESHOLD: 0.7,
    
    // Language hints for better recognition
    LANGUAGE_HINTS: ['en', 'es', 'fr', 'de', 'it', 'pt']
};

// ===================================================
// API KEY MANAGEMENT
// ===================================================

/**
 * Set Google Vision API key
 */
function setApiKey(apiKey) {
    if (!apiKey) {
        console.error('Invalid API key');
        return false;
    }
    
    OCR_CONFIG.API_KEY = apiKey;
    
    // Store in sessionStorage for this session only
    try {
        sessionStorage.setItem('siteweave_ocr_api_key', apiKey);
    } catch (error) {
        console.error('Failed to store API key:', error);
    }
    
    return true;
}

/**
 * Get stored API key
 */
function getApiKey() {
    // First check if it's in memory
    if (OCR_CONFIG.API_KEY) {
        return OCR_CONFIG.API_KEY;
    }
    
    // Then check sessionStorage
    try {
        const stored = sessionStorage.getItem('siteweave_ocr_api_key');
        if (stored) {
            OCR_CONFIG.API_KEY = stored;
            return stored;
        }
    } catch (error) {
        console.error('Failed to retrieve API key:', error);
    }
    
    return null;
}

/**
 * Check if API key is configured
 */
function hasApiKey() {
    return !!getApiKey();
}

// ===================================================
// IMAGE PROCESSING
// ===================================================

/**
 * Process image for OCR
 * @param {File|Blob|string} image - Image file, blob, or base64 string
 * @returns {Promise<Object>} OCR results
 */
async function processImage(image) {
    try {
        // Check if API key is configured
        if (!hasApiKey()) {
            throw new Error('Google Vision API key not configured. Please add your API key in settings.');
        }
        
        // Convert image to base64 if needed
        const base64Image = await convertToBase64(image);
        
        // Validate image size
        if (base64Image.length > OCR_CONFIG.MAX_IMAGE_SIZE) {
            throw new Error('Image too large for OCR processing. Please use a smaller image.');
        }
        
        // Perform OCR
        const ocrResult = await performOCR(base64Image);
        
        // Parse and structure the results
        const structuredContent = parseOCRResults(ocrResult);
        
        return {
            success: true,
            text: structuredContent.text,
            sections: structuredContent.sections,
            confidence: structuredContent.confidence,
            language: structuredContent.language
        };
        
    } catch (error) {
        console.error('OCR processing error:', error);
        return {
            success: false,
            error: error.message,
            fallback: true
        };
    }
}

/**
 * Convert image to base64
 */
async function convertToBase64(image) {
    // If already base64
    if (typeof image === 'string' && image.startsWith('data:')) {
        return image.split(',')[1];
    }
    
    // If it's a file or blob
    if (image instanceof File || image instanceof Blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(image);
        });
    }
    
    throw new Error('Invalid image format');
}

/**
 * Perform OCR using Google Vision API
 */
async function performOCR(base64Image) {
    const apiKey = getApiKey();
    
    const requestBody = {
        requests: [
            {
                image: {
                    content: base64Image
                },
                features: [
                    {
                        type: 'DOCUMENT_TEXT_DETECTION',
                        maxResults: 1
                    }
                ],
                imageContext: {
                    languageHints: OCR_CONFIG.LANGUAGE_HINTS
                }
            }
        ]
    };
    
    try {
        const response = await fetch(`${OCR_CONFIG.GOOGLE_VISION_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OCR API request failed');
        }
        
        const result = await response.json();
        
        if (result.responses && result.responses[0]) {
            return result.responses[0];
        }
        
        throw new Error('No OCR results returned');
        
    } catch (error) {
        console.error('Google Vision API error:', error);
        throw error;
    }
}

/**
 * Parse OCR results into structured content
 */
function parseOCRResults(ocrResult) {
    const structured = {
        text: '',
        sections: [],
        confidence: 0,
        language: 'en'
    };
    
    // Extract full text
    if (ocrResult.fullTextAnnotation) {
        structured.text = ocrResult.fullTextAnnotation.text;
        
        // Detect language
        const pages = ocrResult.fullTextAnnotation.pages || [];
        if (pages.length > 0 && pages[0].property?.detectedLanguages) {
            const languages = pages[0].property.detectedLanguages;
            if (languages.length > 0) {
                structured.language = languages[0].languageCode || 'en';
                structured.confidence = languages[0].confidence || 0;
            }
        }
        
        // Parse into sections based on layout
        structured.sections = parseTextIntoSections(structured.text);
        
    } else if (ocrResult.textAnnotations && ocrResult.textAnnotations.length > 0) {
        // Fallback to simple text annotations
        structured.text = ocrResult.textAnnotations[0].description;
        structured.sections = parseTextIntoSections(structured.text);
    }
    
    return structured;
}

/**
 * Parse text into sections based on structure
 */
function parseTextIntoSections(text) {
    if (!text) return [];
    
    const sections = [];
    
    // Split by common headers or double line breaks
    const blocks = text.split(/\n\n+/);
    
    blocks.forEach((block, index) => {
        const trimmedBlock = block.trim();
        if (!trimmedBlock) return;
        
        // Try to detect if this is a header
        const lines = trimmedBlock.split('\n');
        const firstLine = lines[0].trim();
        
        // Check if first line might be a header (shorter, possibly all caps, etc.)
        const isHeader = firstLine.length < 50 && 
                        (firstLine === firstLine.toUpperCase() || 
                         firstLine.match(/^[A-Z][A-Za-z\s]+:?$/));
        
        if (isHeader && lines.length > 1) {
            // Treat first line as section header
            sections.push({
                id: `section-${index}`,
                name: firstLine.replace(/:$/, ''),
                icon: window.LWB_Utils?.getIconForSection(firstLine) || '📄',
                content: [{
                    type: 'text',
                    value: '<p>' + lines.slice(1).join('</p><p>') + '</p>',
                    allowHtml: false
                }]
            });
        } else {
            // Treat entire block as content
            sections.push({
                id: `section-${index}`,
                name: `Section ${index + 1}`,
                icon: '📄',
                content: [{
                    type: 'text',
                    value: '<p>' + trimmedBlock.replace(/\n/g, '</p><p>') + '</p>',
                    allowHtml: false
                }]
            });
        }
    });
    
    return sections;
}

// ===================================================
// FALLBACK OCR (Browser-based)
// ===================================================

/**
 * Fallback OCR using browser APIs (if available)
 * This is a placeholder for future browser-based OCR APIs
 */
async function fallbackOCR(image) {
    // Check if browser supports any OCR APIs
    if ('TextDetector' in window) {
        try {
            const detector = new window.TextDetector();
            const imageElement = await createImageElement(image);
            const texts = await detector.detect(imageElement);
            
            if (texts && texts.length > 0) {
                const extractedText = texts.map(t => t.rawValue).join(' ');
                return {
                    success: true,
                    text: extractedText,
                    method: 'browser'
                };
            }
        } catch (error) {
            console.error('Browser OCR failed:', error);
        }
    }
    
    // No browser OCR available
    return {
        success: false,
        error: 'OCR not available. Please configure Google Vision API.',
        method: 'none'
    };
}

/**
 * Create image element from various sources
 */
async function createImageElement(source) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => resolve(img);
        img.onerror = reject;
        
        if (typeof source === 'string') {
            img.src = source;
        } else if (source instanceof Blob || source instanceof File) {
            img.src = URL.createObjectURL(source);
        } else {
            reject(new Error('Invalid image source'));
        }
    });
}

// ===================================================
// UI INTEGRATION
// ===================================================

/**
 * Show OCR settings modal
 */
function showOCRSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="this.closest('.modal').remove()">✕</button>
            <h2 class="modal-title">OCR Settings</h2>
            <p class="modal-subtitle">Configure Google Vision API for text extraction from images</p>
            
            <div class="form-group">
                <label class="form-label">
                    Google Vision API Key
                    <span class="info-tooltip" title="Get your API key from Google Cloud Console">ℹ️</span>
                </label>
                <input type="password" id="ocrApiKey" class="form-input" placeholder="Enter your API key">
                <span class="form-help">
                    <a href="https://cloud.google.com/vision/docs/setup" target="_blank">
                        Get an API key from Google Cloud Console →
                    </a>
                </span>
            </div>
            
            <div class="form-group">
                <button class="btn btn-primary" onclick="saveOCRSettings()">
                    Save Settings
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                    Cancel
                </button>
            </div>
            
            <div class="form-group" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <h3>About OCR</h3>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
                    OCR (Optical Character Recognition) allows SiteWeave to extract text from images and scanned documents.
                    This feature requires a Google Vision API key for accurate text extraction.
                </p>
                <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
                    Without OCR configured, you can still:
                    <ul style="font-size: 14px; color: #6b7280;">
                        <li>Upload images as visual content</li>
                        <li>Manually add text to your sections</li>
                        <li>Process PDF files with embedded text</li>
                    </ul>
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load existing API key if available
    const existingKey = getApiKey();
    if (existingKey) {
        document.getElementById('ocrApiKey').value = existingKey;
    }
}

/**
 * Save OCR settings
 */
function saveOCRSettings() {
    const apiKeyInput = document.getElementById('ocrApiKey');
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
        window.LWB_Utils?.showToast('Please enter an API key', 'error');
        return;
    }
    
    if (setApiKey(apiKey)) {
        window.LWB_Utils?.showToast('OCR settings saved successfully', 'success');
        document.querySelector('.modal').remove();
    } else {
        window.LWB_Utils?.showToast('Failed to save OCR settings', 'error');
    }
}

/**
 * Process image with OCR and create sections
 */
async function processImageWithOCR(imageFile, onSuccess, onError) {
    try {
        // Show loading message
        window.LWB_Utils?.showToast('Processing image with OCR...', 'success');
        
        // Process image
        const result = await processImage(imageFile);
        
        if (result.success) {
            // Create sections from OCR text
            const sections = result.sections.length > 0 ? 
                result.sections : 
                window.LWB_Utils?.parseTextIntoSections(result.text, imageFile.name) || [];
            
            // Add header if not present
            if (sections.length > 0 && !sections[0].isHeader) {
                sections.unshift({
                    id: 'header',
                    icon: '🖼️',
                    name: 'Header',
                    isHeader: true,
                    content: [{
                        type: 'text',
                        value: `<h1>${imageFile.name.replace(/\.[^/.]+$/, '')}</h1>`,
                        allowHtml: false
                    }]
                });
            }
            
            onSuccess(sections, imageFile.name);
            window.LWB_Utils?.showToast('Text extracted successfully!', 'success');
        } else {
            // Fallback to simple image upload
            if (result.fallback) {
                window.LWB_Utils?.showToast('OCR not available. Image uploaded without text extraction.', 'error');
                
                // Create basic image sections
                const sections = window.LWB_FileHandlers?.createImagePosterSections(
                    URL.createObjectURL(imageFile),
                    imageFile.name
                ) || [];
                
                onSuccess(sections, imageFile.name);
            } else {
                onError(result.error || 'OCR processing failed');
            }
        }
    } catch (error) {
        console.error('OCR processing error:', error);
        onError(error.message);
    }
}

// ===================================================
// EXPORTS
// ===================================================

// Make functions available globally
window.LWB_OCR = {
    // Configuration
    OCR_CONFIG,
    setApiKey,
    getApiKey,
    hasApiKey,
    
    // Processing
    processImage,
    processImageWithOCR,
    
    // UI
    showOCRSettings,
    saveOCRSettings,
    
    // Utilities
    convertToBase64,
    parseTextIntoSections,
    fallbackOCR
};

// Also make some functions directly available
window.showOCRSettings = showOCRSettings;
window.saveOCRSettings = saveOCRSettings;