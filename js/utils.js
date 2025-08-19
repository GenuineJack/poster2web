/**
 * SITEWEAVE - UTILITIES
 * Helper functions, storage management, and common utilities
 */

// ===================================================
// STORAGE MANAGEMENT
// ===================================================

/**
 * Save project to localStorage with auto-save indicator
 */
function saveProject(project) {
    try {
        const autosaveIndicator = document.getElementById('autosaveIndicator');
        
        if (autosaveIndicator) {
            // Show saving state
            autosaveIndicator.classList.add('saving', 'show');
            autosaveIndicator.textContent = '⏳ Saving...';
        }
        
        // Save to localStorage
        const projectData = JSON.stringify(project);
        localStorage.setItem('siteweave_currentProject', projectData);
        localStorage.setItem('siteweave_lastSaved', new Date().toISOString());
        
        // Show saved state
        setTimeout(() => {
            if (autosaveIndicator) {
                autosaveIndicator.classList.remove('saving');
                autosaveIndicator.textContent = '💾 Auto-saved';
                
                // Hide after 2 seconds
                setTimeout(() => {
                    autosaveIndicator.classList.remove('show');
                }, 2000);
            }
        }, 500);
        
        return true;
    } catch (error) {
        console.error('Failed to save project:', error);
        
        // Check if localStorage is full
        if (error.name === 'QuotaExceededError') {
            showToast('Storage full. Please clear some space.', 'error');
        } else {
            showToast('Failed to save project', 'error');
        }
        
        return false;
    }
}

/**
 * Load project from localStorage
 */
function loadProject() {
    try {
        const saved = localStorage.getItem('siteweave_currentProject');
        if (saved) {
            const project = JSON.parse(saved);
            const lastSaved = localStorage.getItem('siteweave_lastSaved');
            
            if (lastSaved) {
                console.log(`Project last saved: ${new Date(lastSaved).toLocaleString()}`);
            }
            
            return project;
        }
    } catch (error) {
        console.error('Failed to load project:', error);
        showToast('Failed to load saved project', 'error');
    }
    return null;
}

/**
 * Clear saved project
 */
function clearSavedProject() {
    try {
        localStorage.removeItem('siteweave_currentProject');
        localStorage.removeItem('siteweave_lastSaved');
        console.log('Saved project cleared');
    } catch (error) {
        console.error('Failed to clear saved project:', error);
    }
}

/**
 * Export project data as JSON
 */
function exportProjectData(project) {
    const dataStr = JSON.stringify(project, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportName = `siteweave_project_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName);
    linkElement.click();
}

/**
 * Import project data from JSON file
 */
function importProjectData(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const project = JSON.parse(e.target.result);
            
            if (isValidProject(project)) {
                callback(project);
                showToast('Project imported successfully', 'success');
            } else {
                showToast('Invalid project file', 'error');
            }
        } catch (error) {
            console.error('Failed to import project:', error);
            showToast('Failed to import project file', 'error');
        }
    };
    
    reader.readAsText(file);
}

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

/**
 * Create a unique ID for elements
 */
function createUniqueId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Get appropriate icon for section names
 */
function getIconForSection(name) {
    const icons = {
        'abstract': '📄',
        'introduction': '📖',
        'background': '📚',
        'methods': '🔬',
        'methodology': '🔬',
        'results': '📊',
        'discussion': '💬',
        'conclusion': '✅',
        'references': '📚',
        'bibliography': '📚',
        'acknowledgments': '🙏',
        'contact': '📧',
        'about': '📖',
        'services': '⚙️',
        'team': '👥',
        'portfolio': '🎯',
        'projects': '🎯',
        'experience': '💼',
        'education': '🎓',
        'skills': '🛠️',
        'features': '⭐',
        'pricing': '💰',
        'testimonials': '⭐',
        'faq': '❓',
        'schedule': '⏰',
        'speakers': '🎤',
        'registration': '📝',
        'demo': '🎬',
        'download': '📥',
        'header': '📄',
        'content': '📝'
    };
    
    const lowerName = name.toLowerCase();
    
    // Check for exact match
    if (icons[lowerName]) {
        return icons[lowerName];
    }
    
    // Check for partial match
    for (const [key, icon] of Object.entries(icons)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return icon;
        }
    }
    
    return '📄'; // Default icon
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success', duration = 3000) {
    const existingToast = document.getElementById('toast');
    
    if (existingToast) {
        // Update existing toast
        existingToast.textContent = message;
        existingToast.className = `toast show ${type}`;
        
        // Clear any existing timeout
        if (showToast.timeout) {
            clearTimeout(showToast.timeout);
        }
        
        // Set new timeout
        showToast.timeout = setTimeout(() => {
            existingToast.classList.remove('show');
        }, duration);
    } else {
        // Create new toast if it doesn't exist
        const toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = `toast show ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        showToast.timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
}

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Download a file with given content and filename
 */
function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard', 'success');
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                showToast('Copied to clipboard', 'success');
                return true;
            } catch (error) {
                showToast('Failed to copy', 'error');
                return false;
            } finally {
                textArea.remove();
            }
        }
    } catch (error) {
        console.error('Failed to copy:', error);
        showToast('Failed to copy to clipboard', 'error');
        return false;
    }
}

/**
 * Sanitize HTML content for safe display
 */
function sanitizeHtml(html) {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
}

/**
 * Parse text content into meaningful sections
 */
function parseTextIntoSections(text, fileName) {
    const sections = [];
    const cleanFileName = fileName.replace(/\.[^/.]+$/, '');
    
    // Common section headers to look for
    const sectionHeaders = [
        'abstract', 'introduction', 'background', 'methods', 'methodology',
        'results', 'discussion', 'conclusion', 'references', 'acknowledgments',
        'summary', 'objectives', 'materials', 'analysis', 'findings',
        'recommendations', 'future work', 'limitations', 'appendix',
        'overview', 'approach', 'implementation', 'evaluation', 'related work'
    ];
    
    // Create header section
    sections.push({
        id: 'header',
        icon: getIconForSection('header'),
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
                   lowerLine.match(new RegExp(`^\\d+\\.?\\s*${header}`, 'i')) ||
                   lowerLine.includes(header + ':');
        });
        
        if (matchedHeader) {
            // Save previous section if exists
            if (currentSection && currentContent.length > 0) {
                currentSection.content.push({
                    type: 'text',
                    value: formatTextContent(currentContent),
                    allowHtml: false
                });
                sections.push(currentSection);
            }
            
            // Start new section
            currentSection = {
                id: `${matchedHeader}-${createUniqueId()}`,
                icon: getIconForSection(matchedHeader),
                name: capitalizeFirstLetter(matchedHeader),
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
            value: formatTextContent(currentContent),
            allowHtml: false
        });
        sections.push(currentSection);
    }
    
    // If no sections were detected, put all content in one section
    if (sections.length === 1 && lines.length > 0) {
        sections.push({
            id: 'content',
            icon: getIconForSection('content'),
            name: 'Content',
            content: [
                { 
                    type: 'text', 
                    value: formatTextContent(lines), 
                    allowHtml: false 
                }
            ]
        });
    }
    
    return sections;
}

/**
 * Format text content into HTML paragraphs
 */
function formatTextContent(lines) {
    if (!lines || lines.length === 0) return '<p></p>';
    
    const paragraphs = [];
    let currentParagraph = [];
    
    for (const line of lines) {
        if (line.trim() === '') {
            if (currentParagraph.length > 0) {
                paragraphs.push(currentParagraph.join(' '));
                currentParagraph = [];
            }
        } else {
            currentParagraph.push(line);
        }
    }
    
    // Add last paragraph
    if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
    }
    
    // Format as HTML
    return paragraphs.map(p => `<p>${p}</p>`).join('');
}

// ===================================================
// COLOR SCHEMES
// ===================================================

/**
 * Predefined color schemes for the application
 */
const COLOR_SCHEMES = {
    'growth-green': { primary: '#16a34a', secondary: '#15803d' },
    'trust-blue': { primary: '#0ea5e9', secondary: '#0284c7' },
    'premium-purple': { primary: '#9333ea', secondary: '#7c3aed' },
    'bold-red': { primary: '#dc2626', secondary: '#b91c1c' },
    'modern-teal': { primary: '#14b8a6', secondary: '#0d9488' },
    'sunset-orange': { primary: '#f97316', secondary: '#ea580c' },
    'energy-yellow': { primary: '#eab308', secondary: '#ca8a04' },
    'professional-grey': { primary: '#6b7280', secondary: '#4b5563' }
};

/**
 * Get color scheme by name
 */
function getColorScheme(schemeName) {
    return COLOR_SCHEMES[schemeName] || COLOR_SCHEMES['growth-green'];
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Calculate color contrast ratio
 */
function getContrastRatio(color1, color2) {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 1;
    
    const l1 = getLuminance(rgb1);
    const l2 = getLuminance(rgb2);
    
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Get relative luminance of a color
 */
function getLuminance(rgb) {
    const { r, g, b } = rgb;
    const sRGB = [r, g, b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// ===================================================
// DOM HELPERS
// ===================================================

/**
 * Get element by ID with error handling
 */
function getElement(id) {
    return document.getElementById(id);
}

/**
 * Set element value safely
 */
function setElementValue(id, value) {
    const element = getElement(id);
    if (element) {
        if (element.type === 'checkbox') {
            element.checked = value;
        } else {
            element.value = value;
        }
    }
}

/**
 * Get element value safely
 */
function getElementValue(id, defaultValue = '') {
    const element = getElement(id);
    if (!element) return defaultValue;
    
    if (element.type === 'checkbox') {
        return element.checked;
    }
    
    return element.value || defaultValue;
}

/**
 * Show/hide element
 */
function toggleElement(id, show) {
    const element = getElement(id);
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * Add/remove class from element
 */
function toggleClass(id, className, add) {
    const element = getElement(id);
    if (element) {
        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
}

/**
 * Check if element is visible
 */
function isElementVisible(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// ===================================================
// VALIDATION
// ===================================================

/**
 * Validate file type
 */
function isValidFileType(file, allowedTypes = ['pdf', 'pptx', 'docx', 'txt', 'png', 'jpg', 'jpeg']) {
    if (!file) return false;
    
    const extension = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(extension);
}

/**
 * Validate project structure
 */
function isValidProject(project) {
    if (!project || typeof project !== 'object') return false;
    if (!Array.isArray(project.sections)) return false;
    
    // Check required fields
    const hasValidSections = project.sections.every(section => {
        return section.id && 
               section.name && 
               Array.isArray(section.content);
    });
    
    return hasValidSections;
}

/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate hex color
 */
function isValidHexColor(color) {
    return /^#[0-9A-F]{6}$/i.test(color);
}

// ===================================================
// BROWSER COMPATIBILITY
// ===================================================

/**
 * Check if browser supports required features
 */
function checkBrowserCompatibility() {
    const required = {
        localStorage: typeof(Storage) !== 'undefined',
        fileAPI: window.File && window.FileReader && window.FileList && window.Blob,
        promises: typeof Promise !== 'undefined',
        fetch: typeof fetch !== 'undefined'
    };
    
    const missing = [];
    for (const [feature, supported] of Object.entries(required)) {
        if (!supported) {
            missing.push(feature);
        }
    }
    
    if (missing.length > 0) {
        console.warn('Missing browser features:', missing);
        showToast('Your browser may not support all features', 'error');
    }
    
    return missing.length === 0;
}

/**
 * Get browser info
 */
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    if (ua.indexOf('Firefox') > -1) {
        browser = 'Firefox';
        version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
        browser = 'Chrome';
        version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
        browser = 'Safari';
        version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
        browser = 'Edge';
        version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
    }
    
    return { browser, version, userAgent: ua };
}

// ===================================================
// EXPORTS
// ===================================================

// Make functions available globally for the modular system
window.LWB_Utils = {
    // Storage
    saveProject,
    loadProject,
    clearSavedProject,
    exportProjectData,
    importProjectData,
    
    // Utilities
    createUniqueId,
    capitalizeFirstLetter,
    getIconForSection,
    showToast,
    debounce,
    throttle,
    downloadFile,
    copyToClipboard,
    sanitizeHtml,
    parseTextIntoSections,
    formatTextContent,
    
    // Color schemes
    COLOR_SCHEMES,
    getColorScheme,
    hexToRgb,
    getContrastRatio,
    getLuminance,
    
    // DOM helpers
    getElement,
    setElementValue,
    getElementValue,
    toggleElement,
    toggleClass,
    isElementVisible,
    
    // Validation
    isValidFileType,
    isValidProject,
    isValidEmail,
    isValidUrl,
    isValidHexColor,
    
    // Browser compatibility
    checkBrowserCompatibility,
    getBrowserInfo
};