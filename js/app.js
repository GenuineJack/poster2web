/**
 * SITEWEAVE - MAIN APPLICATION
 * Screen management, state handling, and application orchestration
 */

// ===================================================
// APPLICATION STATE
// ===================================================

/**
 * Global application state
 */
let APP_STATE = {
    currentProject: {
        title: 'My Website',
        sections: [],
        logoUrl: null
    },
    settings: {
        primaryColor: '#16a34a',
        secondaryColor: '#15803d',
        titleSize: '32',
        contentSize: '16',
        fontStyle: 'system',
        headerAlignment: 'center',
        logoSize: '120',
        layoutStyle: 'single',
        darkMode: false,
        /**
         * Custom buttons for the website. A maximum of three entries is supported.
         * Each button is an object with an id, a type ('file', 'link' or 'email'),
         * a label and additional fields depending on the type:
         *  - type 'file' includes a `file` object with name and dataUrl
         *  - type 'link' includes a `href` property
         *  - type 'email' includes an `email` property
         */
        buttons: [],

        /**
         * Analytics snippet to be injected into the exported HTML head.
         */
        analyticsCode: ''
    },
    currentScreen: 'upload',
    isLoading: false,
    unsavedChanges: false
};

/**
 * DOM element references
 */
let DOM_REFS = {};

// ===================================================
// APPLICATION INITIALIZATION
// ===================================================

/**
 * Initialize the application when DOM is ready
 */
function initializeApp() {
    console.log('🚀 Initializing SiteWeave...');
    
    // Get DOM references
    cacheDOMReferences();
    
    // Load saved project if exists
    loadSavedProject();

    // Ensure a header section always exists on load.  If a legacy project
    // has no header or has multiple header flags, this will insert or
    // normalize it so that there is exactly one header at index 0.  The
    // function is idempotent and safe to call multiple times.
    ensureHeaderExists(APP_STATE.currentProject);

    // Migrate legacy settings (download/contact buttons) to the new buttons array
    migrateLegacySettings();
    
    // Initialize file handling
    initializeFileHandling();
    
    // Initialize auto-save
    initializeAutoSave();
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    // Initialize current screen
    showScreen('upload');
    
    console.log('✅ SiteWeave initialized successfully');
}

/**
 * Cache DOM element references for performance
 */
function cacheDOMReferences() {
    DOM_REFS = {
        // Screens
        uploadScreen: document.getElementById('uploadScreen'),
        loadingScreen: document.getElementById('loadingScreen'),
        editorScreen: document.getElementById('editorScreen'),
        
        // Upload elements
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        browseBtn: document.getElementById('browseBtn'),
        blankBtn: document.getElementById('blankBtn'),
        builderThemeToggle: document.getElementById('builderThemeToggle'),
        
        // Loading elements
        loadingTitle: document.getElementById('loadingTitle'),
        loadingMessage: document.getElementById('loadingMessage'),
        
        // Editor elements
        backButton: document.getElementById('backButton'),
        pdfName: document.getElementById('pdfName'),
        sectionsContainer: document.getElementById('sectionsContainer'),
        websitePreview: document.getElementById('websitePreview'),
        
        // Settings elements
        primaryColor: document.getElementById('primaryColor'),
        secondaryColor: document.getElementById('secondaryColor'),
        primaryColorHex: document.getElementById('primaryColorHex'),
        secondaryColorHex: document.getElementById('secondaryColorHex'),
        colorScheme: document.getElementById('colorScheme'),
        logoInput: document.getElementById('logoInput'),
        logoSize: document.getElementById('logoSize'),
        logoSizeValue: document.getElementById('logoSizeValue'),
        headerAlignment: document.getElementById('headerAlignment'),
        fontStyle: document.getElementById('fontStyle'),
        titleSize: document.getElementById('titleSize'),
        titleSizeValue: document.getElementById('titleSizeValue'),
        contentSize: document.getElementById('contentSize'),
        contentSizeValue: document.getElementById('contentSizeValue'),
        layoutStyle: document.getElementById('layoutStyle'),
        
        // Settings tab elements
        // Buttons manager elements
        buttonsContainer: document.getElementById('buttonsContainer'),
        addButtonMenu: document.getElementById('addButtonMenu'),
        buttonPreview: document.getElementById('buttonPreview'),
        analyticsCode: document.getElementById('analyticsCode'),
        
        // Modals
        previewModal: document.getElementById('previewModal'),
        exportModal: document.getElementById('exportModal'),
        infoModal: document.getElementById('infoModal'),
        fullPreview: document.getElementById('fullPreview'),
        previewFrame: document.getElementById('previewFrame'),
        
        // Other
        autosaveIndicator: document.getElementById('autosaveIndicator'),
        toast: document.getElementById('toast')
    };
}

/**
 * Load saved project from localStorage
 */
function loadSavedProject() {
    const saved = window.LWB_Utils.loadProject();
    if (saved && window.LWB_Utils.isValidProject(saved)) {
        APP_STATE.currentProject = saved;
        console.log('📂 Loaded saved project:', saved.title);
    }
}

/**
 * Migrate legacy button settings from older versions of the app to the new
 * `settings.buttons` array. This function checks for the presence of the
 * legacy fields (uploadedFile, downloadButtonText, contactButtonUrl,
 * contactButtonText) that may exist on projects saved before the refactor.
 * If found, it creates up to two buttons (file and contact/email) and
 * appends them to the buttons array, preserving any custom labels. After
 * migration the legacy properties are removed to avoid conflicts.
 */
function migrateLegacySettings() {
    const settings = APP_STATE.settings;
    if (!settings) return;
    // If buttons array already exists and has entries, do not migrate.
    if (Array.isArray(settings.buttons) && settings.buttons.length > 0) {
        // Remove any stale legacy fields if present
        delete settings.uploadedFile;
        delete settings.uploadedFileName;
        delete settings.downloadButtonText;
        delete settings.contactButtonUrl;
        delete settings.contactButtonText;
        return;
    }
    const migratedButtons = [];
    // Migrate uploaded file to file button
    if (settings.uploadedFile) {
        const label = settings.downloadButtonText || 'Download';
        migratedButtons.push({
            id: createUniqueId(),
            type: 'file',
            label: label,
            file: settings.uploadedFile
        });
    }
    // Migrate contact button (URL or email)
    if (settings.contactButtonUrl) {
        const url = settings.contactButtonUrl.trim();
        let type = 'link';
        let valueKey = 'href';
        let value = url;
        if (url.includes('@') && !url.match(/^https?:/i)) {
            // treat as email if contains '@' and doesn't look like a URL
            type = 'email';
            valueKey = 'email';
        }
        const label = settings.contactButtonText || 'Contact Us';
        const buttonObj = {
            id: createUniqueId(),
            type: type,
            label: label
        };
        buttonObj[valueKey] = url;
        migratedButtons.push(buttonObj);
    }
    // Assign migrated buttons (max 3) to settings.buttons
    settings.buttons = migratedButtons.slice(0, 3);
    // Remove legacy fields
    delete settings.uploadedFile;
    delete settings.uploadedFileName;
    delete settings.downloadButtonText;
    delete settings.contactButtonUrl;
    delete settings.contactButtonText;
}

// ===================================================
// SCREEN MANAGEMENT
// ===================================================

/**
 * Show specific screen and hide others
 */
function showScreen(screenName) {
    const screens = ['upload', 'loading', 'editor'];
    
    screens.forEach(screen => {
        const element = DOM_REFS[`${screen}Screen`];
        if (element) {
            if (screen === screenName) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        }
    });
    
    APP_STATE.currentScreen = screenName;
    
    // Initialize screen-specific functionality
    if (screenName === 'editor') {
        setTimeout(() => initializeEditor(), 100);
    }
}

/**
 * Handle home navigation
 */
function goHome() {
    if (APP_STATE.currentScreen === 'editor' && APP_STATE.unsavedChanges) {
        if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
            resetToUploadScreen();
        }
    } else {
        resetToUploadScreen();
    }
}

/**
 * Reset application to upload screen
 */
function resetToUploadScreen() {
    // Reset project
    APP_STATE.currentProject = {
        title: 'My Website',
        sections: [],
        logoUrl: null
    };
    
    // Reset settings to defaults. Legacy fields related to download/contact
    // buttons are omitted in favour of the new `buttons` array. Only
    // primary/secondary colours, typography and layout options are retained.
    APP_STATE.settings = {
        primaryColor: '#16a34a',
        secondaryColor: '#15803d',
        titleSize: '32',
        contentSize: '16',
        fontStyle: 'system',
        headerAlignment: 'center',
        logoSize: '120',
        layoutStyle: 'single',
        darkMode: false,
        buttons: [],
        analyticsCode: ''
    };
    
    APP_STATE.unsavedChanges = false;
    
    if (DOM_REFS.fileInput) {
        DOM_REFS.fileInput.value = '';
    }
    
    showScreen('upload');
    window.LWB_Utils.clearSavedProject();
}

// ===================================================
// FILE HANDLING
// ===================================================

/**
 * Initialize file handling functionality
 */
function initializeFileHandling() {
    // Initialize drag and drop
    if (DOM_REFS.dropZone) {
        window.LWB_FileHandlers.initializeDragAndDrop(DOM_REFS.dropZone, handleFile);
        
        // Click to upload
        DOM_REFS.dropZone.addEventListener('click', () => {
            if (DOM_REFS.fileInput) DOM_REFS.fileInput.click();
        });
    }
    
    // Browse button
    if (DOM_REFS.browseBtn) {
        DOM_REFS.browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (DOM_REFS.fileInput) DOM_REFS.fileInput.click();
        });
    }
    
    // File input change
    if (DOM_REFS.fileInput) {
        DOM_REFS.fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });
    }
    
    // Back button
    if (DOM_REFS.backButton) {
        DOM_REFS.backButton.addEventListener('click', goHome);
    }
}

/**
 * Handle file upload and processing
 */
function handleFile(file) {
    if (!file) return;
    
    // Validate file
    const errors = window.LWB_FileHandlers.validateFile(file);
    if (errors.length > 0) {
        window.LWB_Utils.showToast(errors[0], 'error');
        return;
    }
    
    // Show loading screen
    showLoadingScreen('Processing your file', 'Extracting content and analyzing structure...');
    
    // Process file
        window.LWB_FileHandlers.handleFile(
        file,
        (sections, fileName) => {
            // Success callback
            APP_STATE.currentProject.sections = sections;
            APP_STATE.currentProject.title = fileName.replace(/\.[^/.]+$/, '') || 'My Website';
            
            // Ensure there is exactly one header at index 0.  This guards
            // against import handlers that do not create a header.
            ensureHeaderExists(APP_STATE.currentProject);
            
            // Update UI
            if (DOM_REFS.pdfName) {
                DOM_REFS.pdfName.textContent = fileName;
            }
            
            // Show editor
            showScreen('editor');
            // Trigger a project update to refresh the preview and schedule an autosave
            updateProject();
            // Mark unsaved changes after update (updateProject will schedule a save later)
            markUnsavedChanges();
            
            window.LWB_Utils.showToast('File processed successfully!', 'success');
        },
        (error) => {
            // Error callback
            console.error('File processing error:', error);
            window.LWB_Utils.showToast(error, 'error');
            showScreen('upload');
        }
    );
}

/**
 * Show loading screen with custom message
 */
function showLoadingScreen(title, message) {
    if (DOM_REFS.loadingTitle) DOM_REFS.loadingTitle.textContent = title;
    if (DOM_REFS.loadingMessage) DOM_REFS.loadingMessage.textContent = message;
    showScreen('loading');
}

// ===================================================
// EDITOR MANAGEMENT
// ===================================================

/**
 * Initialize editor functionality
 */
function initializeEditor() {
    // Render sections
    window.LWB_Editor.renderSections(APP_STATE.currentProject);
    
    // Auto-expand first non-header section
    const firstSection = APP_STATE.currentProject.sections.find(s => !s.isHeader);
    if (firstSection) {
        setTimeout(() => {
            window.LWB_Editor.expandSection(firstSection.id);
        }, 100);
    }
    
    // Load settings into UI
    loadSettingsIntoUI();
    
    // Update preview
    updatePreview();
}

/**
 * Load current settings into UI elements
 */
function loadSettingsIntoUI() {
    const { settings } = APP_STATE;
    
    // Colors
    if (DOM_REFS.primaryColor) DOM_REFS.primaryColor.value = settings.primaryColor;
    if (DOM_REFS.primaryColorHex) DOM_REFS.primaryColorHex.value = settings.primaryColor;
    if (DOM_REFS.secondaryColor) DOM_REFS.secondaryColor.value = settings.secondaryColor;
    if (DOM_REFS.secondaryColorHex) DOM_REFS.secondaryColorHex.value = settings.secondaryColor;
    
    // Sizes
    if (DOM_REFS.titleSize) DOM_REFS.titleSize.value = settings.titleSize;
    if (DOM_REFS.contentSize) DOM_REFS.contentSize.value = settings.contentSize;
    if (DOM_REFS.logoSize) DOM_REFS.logoSize.value = settings.logoSize;
    
    // Other settings
    if (DOM_REFS.fontStyle) DOM_REFS.fontStyle.value = settings.fontStyle;
    if (DOM_REFS.headerAlignment) DOM_REFS.headerAlignment.value = settings.headerAlignment;
    if (DOM_REFS.layoutStyle) DOM_REFS.layoutStyle.value = settings.layoutStyle;
    if (DOM_REFS.analyticsCode) DOM_REFS.analyticsCode.value = settings.analyticsCode;
    
    // Render custom buttons manager
    if (typeof renderButtonsManager === 'function') {
        renderButtonsManager();
    }
    // Update value displays
    updateSizeDisplays();
}

/**
 * Update size value displays
 */
function updateSizeDisplays() {
    if (DOM_REFS.titleSizeValue) {
        DOM_REFS.titleSizeValue.textContent = `${APP_STATE.settings.titleSize}px`;
    }
    if (DOM_REFS.contentSizeValue) {
        DOM_REFS.contentSizeValue.textContent = `${APP_STATE.settings.contentSize}px`;
    }
    if (DOM_REFS.logoSizeValue) {
        DOM_REFS.logoSizeValue.textContent = `${APP_STATE.settings.logoSize}px`;
    }
}

/**
 * Enforce that the header section (if any) always occupies index 0 in
 * the currentProject.sections array. If multiple sections are marked
 * as header, only the first encountered remains header; others are
 * demoted. If no section is marked header, nothing happens.
 */
function enforceHeaderPosition() {
    const sections = APP_STATE.currentProject.sections;
    if (!Array.isArray(sections) || sections.length === 0) return;
    let headerIndex = -1;
    // Find first header index and demote any subsequent headers
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].isHeader) {
            if (headerIndex === -1) {
                headerIndex = i;
            } else {
                // More than one header found; demote extra headers
                sections[i].isHeader = false;
            }
        }
    }
    if (headerIndex > 0) {
        // Move the header section to the front
        const [headerSection] = sections.splice(headerIndex, 1);
        sections.unshift(headerSection);
    }
}

/**
 * Ensure that the provided project has exactly one header section at index 0.
 *
 * This function will inspect the project.sections array and do the following:
 *  - If no section is marked as the header, a new header section will be
 *    created and inserted at the beginning of the array.  The new header
 *    will use the project title for its H1 if available; otherwise a
 *    generic "Header" label is used.  A default icon is chosen and the
 *    isHeader flag is set to true.
 *  - If multiple sections are flagged as headers, only the first one is
 *    promoted to index 0.  Any additional headers are demoted by
 *    clearing their isHeader flag.
 *  - If a header exists but is not located at index 0, it will be moved
 *    to the front of the array.
 *
 * This helper is idempotent and may be safely called whenever the
 * sections array might have been mutated (e.g. after loading, importing,
 * creating a blank project or updating the project).  It does not
 * perform any rendering or saving; callers should invoke updateProject()
 * afterwards if the change should trigger a re-render.
 *
 * @param {object} project The current project whose sections should be normalized
 */
function ensureHeaderExists(project) {
    if (!project || !Array.isArray(project.sections)) return;
    const sections = project.sections;
    let headerIndices = [];
    for (let i = 0; i < sections.length; i++) {
        if (sections[i].isHeader) {
            headerIndices.push(i);
        }
    }
    if (headerIndices.length === 0) {
        // No existing header – insert a new one at the beginning
        const title = project.title || 'Header';
        const headerId = (window.LWB_Utils && window.LWB_Utils.createUniqueId) ? window.LWB_Utils.createUniqueId() : (Date.now().toString(36));
        const headerSection = {
            id: headerId,
            name: 'Header',
            icon: '📄',
            isHeader: true,
            content: [
                {
                    type: 'text',
                    // Wrap the title in an H1; allowHtml false to ensure consistency
                    value: `<h1>${title}</h1>`,
                    allowHtml: false,
                    id: (window.LWB_Utils && window.LWB_Utils.createUniqueId) ? window.LWB_Utils.createUniqueId() : (Date.now().toString(36) + 'c')
                }
            ]
        };
        sections.unshift(headerSection);
        return;
    }
    // If multiple headers exist, demote all but the first
    for (let i = 1; i < headerIndices.length; i++) {
        sections[headerIndices[i]].isHeader = false;
    }
    // Promote the first header to index 0 if necessary
    const firstHeaderIndex = headerIndices[0];
    if (firstHeaderIndex > 0) {
        const [headerSection] = sections.splice(firstHeaderIndex, 1);
        sections.unshift(headerSection);
    }
}

/**
 * Mark project as having unsaved changes
 */
function markUnsavedChanges() {
    APP_STATE.unsavedChanges = true;
}

/**
 * Update project and trigger save
 */
function updateProject() {
    window.updateProject = updateProject;
    // Guarantee a header section exists and is normalized
    ensureHeaderExists(APP_STATE.currentProject);
    // Ensure the header section remains at the top of the array if present
    enforceHeaderPosition();
    markUnsavedChanges();
    updatePreview();
    
    // Debounced save
    if (updateProject.saveTimeout) {
        clearTimeout(updateProject.saveTimeout);
    }
    updateProject.saveTimeout = setTimeout(() => {
        window.LWB_Utils.saveProject(APP_STATE.currentProject);
        APP_STATE.unsavedChanges = false;
    }, 1000);
}

// ===================================================
// PREVIEW MANAGEMENT
// ===================================================

/**
 * Update website preview
 */
function updatePreview() {
    if (!DOM_REFS.websitePreview) return;
    
    // Save scroll position
    let scrollPos = 0;
    try {
        if (DOM_REFS.websitePreview.contentWindow) {
            scrollPos = DOM_REFS.websitePreview.contentWindow.pageYOffset || 0;
        }
    } catch (e) {
        // Handle cross-origin issues
    }
    
    // Generate preview HTML
    const previewHtml = generatePreviewHtml();
    DOM_REFS.websitePreview.srcdoc = previewHtml;
    
    // Restore scroll position
    DOM_REFS.websitePreview.onload = function() {
        if (scrollPos > 0) {
            setTimeout(() => {
                try {
                    DOM_REFS.websitePreview.contentWindow.scrollTo(0, scrollPos);
                } catch (e) {
                    // Handle cross-origin issues
                }
            }, 100);
        }
    };
}

/**
 * Generate preview HTML
 */
function generatePreviewHtml() {
    const { settings } = APP_STATE;
    const { primaryColor, secondaryColor, layoutStyle, titleSize, contentSize, fontStyle, headerAlignment, logoSize } = settings;
    
    const fontFamily = window.LWB_Export.getFontFamily(fontStyle);
    
    const navHtml = generatePreviewNavigation();
    const sectionsHtml = generatePreviewSections();
    const buttonsHtml = generatePreviewButtons();
    
    // Utility to compute text color based on background brightness
    function getContrastColor(hex) {
        // Remove '#' if present
        let clean = hex.replace('#', '');
        // If shorthand (#abc) expand to full form
        if (clean.length === 3) {
            clean = clean.split('').map(ch => ch + ch).join('');
        }
        const r = parseInt(clean.substring(0, 2), 16) / 255;
        const g = parseInt(clean.substring(2, 4), 16) / 255;
        const b = parseInt(clean.substring(4, 6), 16) / 255;
        // Calculate relative luminance per WCAG
        const toLinear = (c) => {
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
        return L > 0.5 ? '#111111' : '#ffffff';
    }

    const headerTextColor = getContrastColor(primaryColor);

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: ${fontFamily};
                    margin: 0;
                    padding: 0;
                    background: #f8fafc;
                    font-size: ${contentSize}px;
                    line-height: 1.6;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: ${primaryColor};
                    color: ${headerTextColor};
                    padding: 60px 40px;
                    border-radius: 16px;
                    margin-bottom: 30px;
                    text-align: ${headerAlignment};
                    position: relative;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .logo {
                    max-width: ${logoSize}px;
                    max-height: ${logoSize}px;
                    margin-bottom: 20px;
                    background: white;
                    padding: 12px;
                    border-radius: 12px;
                    display: inline-block;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { 
                    margin: 0 0 10px 0; 
                    font-size: ${titleSize}px;
                    font-weight: 700;
                }
                h2 {
                    margin: 0 0 16px 0;
                    font-size: ${Math.round(titleSize * 0.75)}px;
                    color: ${primaryColor};
                }
                h3 {
                    margin: 16px 0 12px 0;
                    font-size: ${Math.round(titleSize * 0.6)}px;
                    color: #374151;
                }
                .section {
                    background: white;
                    padding: 30px;
                    margin-bottom: 20px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    scroll-margin-top: ${layoutStyle === 'sections' ? '80px' : '20px'};
                }
                .content-block {
                    margin-bottom: 20px;
                }
                .content-block p {
                    margin-bottom: 12px;
                }
                .content-block ul,
                .content-block ol {
                    margin-left: 20px;
                    margin-bottom: 12px;
                }
                .content-block a {
                    color: ${primaryColor};
                    text-decoration: underline;
                }
                .content-block a:hover {
                    color: ${secondaryColor};
                }
                .image-block {
                    text-align: center;
                    margin: 20px 0;
                }
                .image-block img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .image-caption {
                    margin-top: 12px;
                    font-style: italic;
                    color: #666;
                    font-size: ${Math.round(contentSize * 0.9)}px;
                }
                .image-caption a {
                    color: ${primaryColor};
                    text-decoration: underline;
                }
                .image-caption a:hover {
                    color: ${secondaryColor};
                }
                .pdf-download {
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    color: white;
                    padding: 16px 32px;
                    border-radius: 50px;
                    font-weight: 600;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                    border: none;
                    cursor: pointer;
                    font-size: 16px;
                    display: inline-block;
                    margin: 40px auto 20px;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }
                .pdf-download:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                .pdf-download-container {
                    text-align: center;
                    padding: 20px;
                    background: white;
                    margin-top: 40px;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                
                /* Navigation styles */
                nav {
                    position: sticky;
                    top: 0;
                    background: white;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 16px;
                    z-index: 100;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                nav .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                nav a {
                    color: ${primaryColor};
                    text-decoration: none;
                    font-weight: 500;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                nav a:hover {
                    background: #f0fdf4;
                }
                
                /* Hamburger menu styles */
                #hamburgerMenu {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                }
                #hamburgerMenu button {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 10px;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .menu-line {
                    width: 24px;
                    height: 2px;
                    background: ${primaryColor};
                    margin: 4px 0;
                }
                #menuDropdown {
                    display: none;
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    margin-top: 8px;
                    padding: 16px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    min-width: 200px;
                }
                #menuDropdown a {
                    display: block;
                    padding: 8px 12px;
                    color: ${primaryColor};
                    text-decoration: none;
                    font-weight: 500;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                #menuDropdown a:hover {
                    background: #f0fdf4;
                }
                #menuDropdown hr {
                    margin: 12px 0;
                    border: none;
                    border-top: 1px solid #e5e7eb;
                }
                #menuDropdown .pdf-download {
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    color: white !important;
                    text-align: center;
                    display: block;
                    margin-top: 8px;
                }
            </style>
        </head>
        <body>
            ${navHtml}
            <div class="container">
                ${sectionsHtml}
            </div>
            ${layoutStyle === 'single' ? buttonsHtml : ''}
            
            ${layoutStyle === 'menu' ? `
            <script>
                function toggleMenu() {
                    const dropdown = document.getElementById('menuDropdown');
                    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                }
                document.addEventListener('click', function(event) {
                    const menu = document.getElementById('hamburgerMenu');
                    if (menu && !menu.contains(event.target)) {
                        const dropdown = document.getElementById('menuDropdown');
                        if (dropdown) dropdown.style.display = 'none';
                    }
                });
            </script>
            ` : ''}
        </body>
        </html>
    `;
}

/**
 * Generate preview navigation
 */
function generatePreviewNavigation() {
    const { settings, currentProject } = APP_STATE;
    const { layoutStyle } = settings;
    const buttons = generatePreviewButtonsArray();

    // Helper to build section link label respecting the showIcon flag
    const buildSectionLabel = (section) => {
        const iconPart = section.showIcon === false ? '' : `${section.icon} `;
        return `${iconPart}${section.name}`;
    };

    if (layoutStyle === 'sections') {
        return `
            <nav>
                <div class="nav-container">
                    ${currentProject.sections.map(section => 
                        `<a href="#${section.id}">${buildSectionLabel(section)}</a>`
                    ).join('')}
                    <div style="margin-left: auto;">
                        ${buttons.join('')}
                    </div>
                </div>
            </nav>
        `;
    } else if (layoutStyle === 'menu') {
        return `
            <div id="hamburgerMenu">
                <button onclick="toggleMenu()">
                    <div class="menu-line"></div>
                    <div class="menu-line"></div>
                    <div class="menu-line"></div>
                </button>
                <div id="menuDropdown">
                    ${currentProject.sections.map(section => 
                        `<a href="#${section.id}" onclick="toggleMenu()">${buildSectionLabel(section)}</a>`
                    ).join('')}
                    <hr>
                    ${buttons.join('')}
                </div>
            </div>
        `;
    }

    return '';
}

/**
 * Generate preview buttons array
 */
function generatePreviewButtonsArray() {
    const result = [];
    const buttonSettings = APP_STATE.settings?.buttons || [];
    // Simple HTML escaping helper
    const esc = (str) => {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
    buttonSettings.forEach(btn => {
        const label = btn.label || (btn.type === 'file' ? 'Download' : btn.type === 'email' ? 'Email us' : 'Visit site');
        if (btn.type === 'file' && btn.file) {
            // Use alert for preview to indicate file download
            result.push(`<button class="pdf-download" onclick="alert('Download: ${esc(btn.file.name)}')">📄 ${esc(label)}</button>`);
        } else if (btn.type === 'email' && btn.email) {
            result.push(`<button class="pdf-download" onclick="alert('Email: ${esc(btn.email)}')">📧 ${esc(label)}</button>`);
        } else if (btn.type === 'link' && btn.href) {
            // Normalize URL: prefix with https:// if protocol missing
            let normalized = btn.href.trim();
            if (!/^https?:\/\//i.test(normalized)) {
                normalized = 'https://' + normalized;
            }
            result.push(`<button class="pdf-download" onclick="alert('Link: ${esc(normalized)}')">🔗 ${esc(label)}</button>`);
        }
    });
    return result;
}

/**
 * Generate preview buttons HTML
 */
function generatePreviewButtons() {
    const buttons = generatePreviewButtonsArray();
    return `
        <div class="pdf-download-container">
            ${buttons.join('')}
        </div>
    `;
}

/**
 * Generate preview sections
 */
function generatePreviewSections() {
    return APP_STATE.currentProject.sections.map(section => {
        if (section.isHeader) {
            // Header section does not display the section name or icon; only the logo and content
            return `
                <div class="header" id="${section.id}">
                    ${APP_STATE.currentProject.logoUrl ? `<div><img src="${APP_STATE.currentProject.logoUrl}" class="logo" alt="Logo"></div>` : ''}
                    ${section.content.map(content => {
                        if (content.type === 'text') {
                            return content.allowHtml ? content.value : `<div>${content.value}</div>`;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
        } else {
            // Determine label prefix: include icon only if showIcon is not explicitly false
            const labelPrefix = section.showIcon === false ? '' : `${section.icon} `;
            return `
                <div class="section" id="${section.id}">
                    <h2>${labelPrefix}${section.name}</h2>
                    ${section.content.map(content => {
                        if (content.type === 'text') {
                            return `<div class="content-block">${content.value}</div>`;
                        } else if (content.type === 'image' && content.url) {
                            return `
                                <div class="image-block">
                                    <img src="${content.url}" alt="${section.name} image">
                                    ${content.caption ? `<div class="image-caption">${content.caption}</div>` : ''}
                                </div>
                            `;
                        }
                        return '';
                    }).join('')}
                </div>
            `;
        }
    }).join('');
}

// ===================================================
// SETTINGS MANAGEMENT
// ===================================================

/**
 * Update color scheme
 */
function updateColorScheme() {
    const scheme = DOM_REFS.colorScheme?.value;
    if (!scheme) return;
    
    const colors = window.LWB_Utils.getColorScheme(scheme);
    
    if (colors && scheme !== 'custom') {
        APP_STATE.settings.primaryColor = colors.primary;
        APP_STATE.settings.secondaryColor = colors.secondary;
        
        if (DOM_REFS.primaryColor) DOM_REFS.primaryColor.value = colors.primary;
        if (DOM_REFS.primaryColorHex) DOM_REFS.primaryColorHex.value = colors.primary;
        if (DOM_REFS.secondaryColor) DOM_REFS.secondaryColor.value = colors.secondary;
        if (DOM_REFS.secondaryColorHex) DOM_REFS.secondaryColorHex.value = colors.secondary;
        
        updateProject();
    }
}

/**
 * Update title size
 */
function updateTitleSize() {
    const size = DOM_REFS.titleSize?.value;
    if (size) {
        APP_STATE.settings.titleSize = size;
        if (DOM_REFS.titleSizeValue) {
            DOM_REFS.titleSizeValue.textContent = `${size}px`;
        }
        updateProject();
    }
}

/**
 * Update content size
 */
function updateContentSize() {
    const size = DOM_REFS.contentSize?.value;
    if (size) {
        APP_STATE.settings.contentSize = size;
        if (DOM_REFS.contentSizeValue) {
            DOM_REFS.contentSizeValue.textContent = `${size}px`;
        }
        updateProject();
    }
}

/**
 * Update logo size
 */
function updateLogoSize() {
    const size = DOM_REFS.logoSize?.value;
    if (size) {
        APP_STATE.settings.logoSize = size;
        if (DOM_REFS.logoSizeValue) {
            DOM_REFS.logoSizeValue.textContent = `${size}px`;
        }
        updateProject();
    }
}

/**
 * Handle logo upload
 */
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate image
    if (!file.type.startsWith('image/')) {
        window.LWB_Utils.showToast('Please upload an image file', 'error');
        return;
    }
    
    // Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
        window.LWB_Utils.showToast('Logo file too large. Maximum size is 5MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        APP_STATE.currentProject.logoUrl = e.target.result;
        
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
            logoPreview.innerHTML = `
                <img src="${e.target.result}" style="max-width: 200px; margin-top: 10px; border-radius: 8px; border: 1px solid #e5e7eb; padding: 8px; background: white;">
                <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Logo uploaded successfully! Use the size slider above to adjust.</p>
            `;
        }
        
        updateProject();
        window.LWB_Utils.showToast('Logo uploaded successfully', 'success');
    };
    reader.readAsDataURL(file);
}

// ===================================================
// TAB MANAGEMENT
// ===================================================

/**
 * Switch between content, design, and settings tabs
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

// ===================================================
// SETTINGS TAB FUNCTIONALITY
// ===================================================

// ===================================================
// CUSTOM BUTTONS MANAGER
// ===================================================

/**
 * Create a new button and add it to the settings. Supports a maximum of three buttons.
 * @param {string} type The button type ('file', 'link', or 'email').
 */
function addButton(type) {
    if (!['file', 'link', 'email'].includes(type)) return;
    const buttons = APP_STATE.settings.buttons || [];
    if (buttons.length >= 3) {
        window.LWB_Utils.showToast('You can only add up to 3 buttons', 'error');
        return;
    }
    const id = createUniqueId();
    // Default labels depending on type
    let label;
    if (type === 'file') label = 'Download';
    else if (type === 'link') label = 'Visit site';
    else label = 'Email us';
    const newBtn = { id, type, label };
    // For link/email, create empty field for user to fill
    if (type === 'link') newBtn.href = '';
    if (type === 'email') newBtn.email = '';
    buttons.push(newBtn);
    APP_STATE.settings.buttons = buttons;
    renderButtonsManager();
    updateProject();
}

/**
 * Update a button's property. Accepts partial updates.
 * @param {string} id Button id
 * @param {Object} updates Key-value pairs of properties to update
 */
function updateButton(id, updates) {
    const buttons = APP_STATE.settings.buttons || [];
    const index = buttons.findIndex(b => b.id === id);
    if (index === -1) return;
    buttons[index] = { ...buttons[index], ...updates };
    APP_STATE.settings.buttons = buttons;
    renderButtonsManager();
    updateProject();
}

/**
 * Remove a button by id
 * @param {string} id Button id
 */
function removeButton(id) {
    const buttons = APP_STATE.settings.buttons || [];
    APP_STATE.settings.buttons = buttons.filter(b => b.id !== id);
    renderButtonsManager();
    updateProject();
}

/**
 * Move a button from one index to another to reorder
 * @param {number} fromIndex Original index
 * @param {number} toIndex Target index
 */
function reorderButtons(fromIndex, toIndex) {
    const buttons = APP_STATE.settings.buttons || [];
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= buttons.length || toIndex >= buttons.length) return;
    const [moved] = buttons.splice(fromIndex, 1);
    buttons.splice(toIndex, 0, moved);
    APP_STATE.settings.buttons = buttons;
    renderButtonsManager();
    updateProject();
}

/**
 * Handle file upload for a specific button. Reads the file as data URL and updates the button object.
 * @param {Event} event The file input change event
 * @param {string} id The id of the button being updated
 */
function handleButtonFileUpload(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        updateButton(id, {
            file: {
                name: file.name,
                size: file.size,
                type: file.type,
                dataUrl: e.target.result
            }
        });
        window.LWB_Utils.showToast('File uploaded for button', 'success');
    };
    reader.readAsDataURL(file);
}

/**
 * Render the buttons manager UI. This function rebuilds the list of button controls
 * and the add button controls inside the settings tab whenever the buttons array changes.
 */
function renderButtonsManager() {
    const container = DOM_REFS.buttonsContainer;
    const addMenu = DOM_REFS.addButtonMenu;
    const preview = DOM_REFS.buttonPreview;
    if (!container) return;
    const buttons = APP_STATE.settings.buttons || [];
    // Clear container
    container.innerHTML = '';
    // Build list items
    buttons.forEach((btn, index) => {
        const item = document.createElement('div');
        item.className = 'button-item';
        // Type label
        const typeLabel = document.createElement('span');
        typeLabel.textContent = btn.type === 'file' ? 'File' : btn.type === 'link' ? 'Link' : 'Email';
        item.appendChild(typeLabel);
        // Label input
        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.value = btn.label || '';
        labelInput.placeholder = 'Button label';
        labelInput.className = 'form-input';
        labelInput.onchange = (e) => updateButton(btn.id, { label: e.target.value });
        item.appendChild(labelInput);
        // Value input (file/link/email)
        let valueInput;
        if (btn.type === 'file') {
            valueInput = document.createElement('div');
            const fileButton = document.createElement('label');
            fileButton.className = 'file-upload-label';
            fileButton.style.display = 'inline-block';
            fileButton.style.padding = '6px 12px';
            fileButton.style.background = 'var(--primary)';
            fileButton.style.color = 'white';
            fileButton.style.borderRadius = 'var(--radius-md)';
            fileButton.style.cursor = 'pointer';
            fileButton.textContent = btn.file ? 'Change File' : 'Upload File';
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            fileInput.onchange = (e) => handleButtonFileUpload(e, btn.id);
            fileButton.appendChild(fileInput);
            valueInput.appendChild(fileButton);
            if (btn.file) {
                const fileInfo = document.createElement('div');
                fileInfo.style.fontSize = '12px';
                fileInfo.style.marginTop = '4px';
                fileInfo.textContent = btn.file.name;
                valueInput.appendChild(fileInfo);
            }
        } else {
            valueInput = document.createElement('input');
            valueInput.type = btn.type === 'email' ? 'email' : 'url';
            valueInput.value = btn.type === 'email' ? (btn.email || '') : (btn.href || '');
            valueInput.placeholder = btn.type === 'email' ? 'Email address' : 'https://example.com';
            valueInput.className = 'form-input';
            valueInput.onchange = (e) => {
                const val = e.target.value;
                if (btn.type === 'email') {
                    updateButton(btn.id, { email: val });
                } else {
                    updateButton(btn.id, { href: val });
                }
            };
        }
        item.appendChild(valueInput);
        // Reorder controls
        const reorderContainer = document.createElement('div');
        reorderContainer.style.display = 'flex';
        reorderContainer.style.flexDirection = 'column';
        const upBtn = document.createElement('button');
        upBtn.className = 'icon-btn';
        upBtn.textContent = '↑';
        upBtn.disabled = (index === 0);
        upBtn.onclick = () => reorderButtons(index, index - 1);
        const downBtn = document.createElement('button');
        downBtn.className = 'icon-btn';
        downBtn.textContent = '↓';
        downBtn.disabled = (index === buttons.length - 1);
        downBtn.onclick = () => reorderButtons(index, index + 1);
        reorderContainer.appendChild(upBtn);
        reorderContainer.appendChild(downBtn);
        item.appendChild(reorderContainer);
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn danger';
        deleteBtn.textContent = '🗑';
        deleteBtn.onclick = () => removeButton(btn.id);
        item.appendChild(deleteBtn);
        container.appendChild(item);
    });
    // Update add button menu visibility
    if (addMenu) {
        if (buttons.length >= 3) {
            addMenu.style.display = 'none';
        } else {
            addMenu.style.display = '';
        }
    }
    // Render preview of buttons
    if (preview) {
        const previewButtons = generatePreviewButtonsArray();
        if (previewButtons.length > 0) {
            preview.innerHTML = previewButtons.join('');
        } else {
            preview.innerHTML = '<p style="color: var(--muted-foreground); font-size: 14px;">No buttons configured</p>';
        }
    }
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'docx': '📝', 
        'doc': '📝',
        'txt': '📄',
        'png': '🖼️',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'pptx': '📊',
        'xlsx': '📈'
    };
    return icons[ext] || '📄';
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type from filename
 */
function getFileType(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Toggle dark mode for builder
 */
function toggleBuilderDarkMode() {
    const root = document.body;
    root.classList.toggle('builder-dark');
    const isDark = root.classList.contains('builder-dark');
    APP_STATE.settings.darkMode = isDark;
    const btn = document.getElementById('builderThemeToggle');
    if (btn) btn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
}

// ===================================================
// MODAL MANAGEMENT
// ===================================================

/**
 * Show preview modal
 */
function showPreviewModal() {
    if (!DOM_REFS.previewModal || !DOM_REFS.fullPreview) return;
    
    // Copy current preview
    DOM_REFS.fullPreview.srcdoc = DOM_REFS.websitePreview.srcdoc;
    
    // Show modal
    DOM_REFS.previewModal.classList.add('active');
    
    // Sync scroll position
    DOM_REFS.fullPreview.onload = function() {
        try {
            const scrollPos = DOM_REFS.websitePreview.contentWindow.pageYOffset || 0;
            if (scrollPos > 0) {
                setTimeout(() => {
                    DOM_REFS.fullPreview.contentWindow.scrollTo(0, scrollPos);
                }, 100);
            }
        } catch (e) {
            // Handle cross-origin issues
        }
    };
}

/**
 * Close preview modal
 */
function closePreviewModal() {
    if (!DOM_REFS.previewModal) return;
    
    // Sync scroll position back
    try {
        const modalScrollPos = DOM_REFS.fullPreview.contentWindow.pageYOffset || 0;
        if (modalScrollPos > 0) {
            setTimeout(() => {
                DOM_REFS.websitePreview.contentWindow.scrollTo(0, modalScrollPos);
            }, 100);
        }
    } catch (e) {
        // Handle cross-origin issues
    }
    
    DOM_REFS.previewModal.classList.remove('active');
}

/**
 * Set preview device frame
 */
function setPreviewDevice(device) {
    if (!DOM_REFS.previewFrame) return;
    
    DOM_REFS.previewFrame.className = `preview-frame ${device}`;
    
    // Update button states
    document.querySelectorAll('.modal-header .btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Find and activate the right button
    const btnId = device === 'desktop' ? 'desktopBtn' : 
                  device === 'tablet-h' ? 'tabletHBtn' :
                  device === 'tablet-v' ? 'tabletVBtn' : 'mobileBtn';
    
    const deviceBtn = document.getElementById(btnId);
    if (deviceBtn) {
        deviceBtn.classList.add('active');
    }
}

/**
 * Show export modal
 */
function exportWebsite() {
    if (DOM_REFS.exportModal) {
        DOM_REFS.exportModal.classList.add('active');
    }
}

/**
 * Close export modal
 */
function closeExportModal() {
    if (DOM_REFS.exportModal) {
        DOM_REFS.exportModal.classList.remove('active');
    }
}

/**
 * Download website with selected format
 */
function downloadWebsite() {
    const formatInput = document.querySelector('input[name="exportFormat"]:checked');
    const format = formatInput ? formatInput.value : 'html';
    
    window.LWB_Utils.showToast(`Generating ${format.toUpperCase()} file...`, 'success');
    
    // Add analytics code from settings
    APP_STATE.settings.analyticsCode = DOM_REFS.analyticsCode?.value || '';
    
    const result = window.LWB_Export.exportWebsite(APP_STATE.currentProject, APP_STATE.settings, format);
    
    if (result.success) {
        closeExportModal();
        setTimeout(() => {
            window.LWB_Utils.showToast('Download complete!', 'success');
        }, 500);
    } else {
        window.LWB_Utils.showToast(`Export failed: ${result.error}`, 'error');
    }
}

/**
 * Show info modal
 */
function showInfo() {
    if (DOM_REFS.infoModal) {
        DOM_REFS.infoModal.classList.add('active');
    }
}

/**
 * Close info modal
 */
function closeInfoModal() {
    if (DOM_REFS.infoModal) {
        DOM_REFS.infoModal.classList.remove('active');
    }
}

// ===================================================
// AUTO-SAVE
// ===================================================

/**
 * Initialize auto-save functionality
 */
function initializeAutoSave() {
    // Auto-save every 30 seconds if there are unsaved changes
    setInterval(() => {
        if (APP_STATE.unsavedChanges) {
            window.LWB_Utils.saveProject(APP_STATE.currentProject);
            APP_STATE.unsavedChanges = false;
        }
    }, 30000);
}

// ===================================================
// GLOBAL EVENT LISTENERS
// ===================================================

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
    // 'Create Blank Website' button
    if (DOM_REFS.blankBtn) {
        DOM_REFS.blankBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            createBlankWebsite();
        });
    }

    // Handle settings changes
    const settingsElements = [
        { id: 'primaryColor', handler: updateColorInput },
        { id: 'primaryColorHex', handler: updateColorInput },
        { id: 'secondaryColor', handler: updateColorInput },
        { id: 'secondaryColorHex', handler: updateColorInput },
        { id: 'headerAlignment', handler: updateSetting },
        { id: 'fontStyle', handler: updateSetting },
        { id: 'layoutStyle', handler: updateSetting }
    ];
    
    settingsElements.forEach(({ id, handler }) => {
        const element = DOM_REFS[id];
        if (element) {
            element.addEventListener('change', handler || updateSetting);
        }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (APP_STATE.unsavedChanges) {
                window.LWB_Utils.saveProject(APP_STATE.currentProject);
                APP_STATE.unsavedChanges = false;
                window.LWB_Utils.showToast('Project saved', 'success');
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closePreviewModal();
            closeExportModal();
            closeInfoModal();
        }
    });
    
    // Handle window beforeunload
    window.addEventListener('beforeunload', (e) => {
        if (APP_STATE.unsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

/**
 * Update color input handler
 */
function updateColorInput(e) {
    const id = e.target.id;
    const value = e.target.value;
    
    if (id === 'primaryColor' || id === 'primaryColorHex') {
        APP_STATE.settings.primaryColor = value;
        if (DOM_REFS.primaryColor) DOM_REFS.primaryColor.value = value;
        if (DOM_REFS.primaryColorHex) DOM_REFS.primaryColorHex.value = value;
    } else if (id === 'secondaryColor' || id === 'secondaryColorHex') {
        APP_STATE.settings.secondaryColor = value;
        if (DOM_REFS.secondaryColor) DOM_REFS.secondaryColor.value = value;
        if (DOM_REFS.secondaryColorHex) DOM_REFS.secondaryColorHex.value = value;
    }
    
    updateProject();
}

/**
 * Update setting handler
 */
function updateSetting(e) {
    const id = e.target.id;
    const value = e.target.value;
    APP_STATE.settings[id] = value;
    updateProject();
}

// ===================================================
// BLANK WEBSITE CREATION
// ===================================================
function createBlankWebsite() {
    // Reset project with a basic structure
    APP_STATE.currentProject = {
        title: 'Untitled Website',
        logoUrl: null,
        sections: [
            { id: window.LWB_Utils.createUniqueId(), name: 'Header', icon: '📄', isHeader: true, collapsed: false, content: [
                { id: window.LWB_Utils.createUniqueId(), type: 'text', value: '<h1>Title</h1><p>Intro paragraph. Replace me with your content.</p>', allowHtml: false }
            ]},
            { id: window.LWB_Utils.createUniqueId(), name: 'Content', icon: '📝', collapsed: false, content: [
                { id: window.LWB_Utils.createUniqueId(), type: 'text', value: '<h2>Section</h2><p>Add text and images here.</p>', allowHtml: false }
            ]}
        ]
    };
    APP_STATE.settings.layoutStyle = 'single';
    APP_STATE.unsavedChanges = true;
    document.getElementById('pdfName').textContent = 'Blank Project';
    window.LWB_Editor.renderSections(APP_STATE.currentProject);
    showScreen('editor');
    updateProject();
    window.LWB_Utils.showToast('Blank website created', 'success');
}

// ===================================================
// INFO MODAL CTA
// ===================================================
function getStartedFromModal() {
    closeInfoModal();
    
    // Smooth scroll to the upload area
    const uploadContainer = document.querySelector('.upload-container');
    if (uploadContainer) {
        uploadContainer.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Add a subtle highlight effect
        const dropZone = document.getElementById('dropZone');
        if (dropZone) {
            // Store original styles
            const originalTransform = dropZone.style.transform;
            const originalBoxShadow = dropZone.style.boxShadow;
            const originalBorderColor = dropZone.style.borderColor;
            
            // Apply highlight effect
            dropZone.style.transform = 'scale(1.02)';
            dropZone.style.boxShadow = 'var(--shadow-xl)';
            dropZone.style.borderColor = 'var(--primary)';
            
            // Restore original styles after effect
            setTimeout(() => {
                dropZone.style.transform = originalTransform;
                dropZone.style.boxShadow = originalBoxShadow;
                dropZone.style.borderColor = originalBorderColor;
            }, 2000);
        }
    }
    
    // Optional: Open file dialog after a delay
    setTimeout(() => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.click();
        }
    }, 800);
}

// ===================================================
// GLOBAL FUNCTION EXPORTS
// ===================================================

/**
 * Make functions available globally for inline event handlers
 */
window.goHome = goHome;
window.showInfo = showInfo;
window.closeInfoModal = closeInfoModal;
window.getStartedFromModal = getStartedFromModal;
window.updateColorScheme = updateColorScheme;
window.updateTitleSize = updateTitleSize;
window.updateContentSize = updateContentSize;
window.updateLogoSize = updateLogoSize;
window.handleLogoUpload = handleLogoUpload;
window.switchTab = switchTab;
window.showPreviewModal = showPreviewModal;
window.closePreviewModal = closePreviewModal;
window.setPreviewDevice = setPreviewDevice;
window.exportWebsite = exportWebsite;
window.closeExportModal = closeExportModal;
window.downloadWebsite = downloadWebsite;
window.updatePreview = updatePreview;
// Buttons manager exposure
window.addButton = addButton;
window.updateButton = updateButton;
window.removeButton = removeButton;
window.reorderButtons = reorderButtons;
window.renderButtonsManager = renderButtonsManager;
window.handleButtonFileUpload = handleButtonFileUpload;
window.toggleBuilderDarkMode = toggleBuilderDarkMode;

// Editor functions (connected to the modular editor)
window.addSection = () => window.LWB_Editor.addSection(APP_STATE.currentProject, updateProject);
window.deleteSection = (index) => window.LWB_Editor.deleteSection(APP_STATE.currentProject, index, updateProject);
window.moveSection = (index, direction) => window.LWB_Editor.moveSection(APP_STATE.currentProject, index, direction, updateProject);
window.updateSectionName = (index, value) => window.LWB_Editor.updateSectionName(APP_STATE.currentProject, index, value, updateProject);
window.toggleSection = window.LWB_Editor.toggleSection;

window.addTextToSection = (sectionIndex) => window.LWB_Editor.addTextToSection(APP_STATE.currentProject, sectionIndex, updateProject);
window.addImageToSection = (sectionIndex) => window.LWB_Editor.addImageToSection(APP_STATE.currentProject, sectionIndex, updateProject);
window.deleteContent = (sectionIndex, contentIndex) => window.LWB_Editor.deleteContent(APP_STATE.currentProject, sectionIndex, contentIndex, updateProject);
window.moveContent = (sectionIndex, contentIndex, direction) => window.LWB_Editor.moveContent(APP_STATE.currentProject, sectionIndex, contentIndex, direction, updateProject);

window.updateContentValue = (sectionIndex, contentIndex, value) => window.LWB_Editor.updateContentValue(APP_STATE.currentProject, sectionIndex, contentIndex, value, updateProject);
window.toggleHtml = (sectionIndex, contentIndex, enabled) => window.LWB_Editor.toggleHtml(APP_STATE.currentProject, sectionIndex, contentIndex, enabled, updateProject);
window.formatText = (command, sectionIndex, contentIndex, value) => window.LWB_Editor.formatText(command, sectionIndex, contentIndex, value, APP_STATE.currentProject, updateProject);
window.insertLink = (sectionIndex, contentIndex) => window.LWB_Editor.insertLink(sectionIndex, contentIndex, APP_STATE.currentProject, updateProject);
window.formatCaption = (command, sectionIndex, contentIndex) => window.LWB_Editor.formatCaption(command, sectionIndex, contentIndex, APP_STATE.currentProject, updateProject);
window.insertCaptionLink = (sectionIndex, contentIndex) => window.LWB_Editor.insertCaptionLink(sectionIndex, contentIndex, APP_STATE.currentProject, updateProject);

window.handleImageUpload = (sectionIndex, contentIndex, event) => window.LWB_Editor.handleImageUpload(APP_STATE.currentProject, sectionIndex, contentIndex, event, updateProject);
window.updateImageCaption = (sectionIndex, contentIndex, caption) => window.LWB_Editor.updateImageCaption(APP_STATE.currentProject, sectionIndex, contentIndex, caption, updateProject);

// ===================================================
// APPLICATION STARTUP
// ===================================================

/**
 * Start the application when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
