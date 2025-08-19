/**
 * SITEWEAVE - EDITOR
 * Section management, rich text editing, and content manipulation
 */

// ===================================================
// SECTION MANAGEMENT
// ===================================================

/**
 * Render all sections in the editor
 */
function renderSections(project) {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    
    // Store expanded states before re-rendering
    const expandedStates = {};
    project.sections.forEach(section => {
        const sectionContent = document.getElementById(`section-${section.id}`);
        if (sectionContent) {
            expandedStates[section.id] = sectionContent.classList.contains('expanded');
        }
    });
    
    container.innerHTML = '';

    // Ensure all sections have a defined showIcon property. When undefined,
    // default to true so icons remain visible unless explicitly hidden by the user.
    project.sections.forEach(section => {
        if (typeof section.showIcon === 'undefined') {
            section.showIcon = true;
        }
    });
    
    project.sections.forEach((section, sectionIndex) => {
        const sectionElement = createSectionElement(section, sectionIndex, project);
        container.appendChild(sectionElement);
        
        // Restore expanded state
        if (expandedStates[section.id]) {
            const sectionContent = document.getElementById(`section-${section.id}`);
            if (sectionContent) {
                sectionContent.classList.add('expanded');
                // Update indicator rotation
                const indicator = sectionElement.querySelector('.expand-indicator');
                if (indicator) {
                    indicator.style.transform = 'rotate(180deg)';
                }
            }
        }
    });
}

/**
 * Create a section element
 */
function createSectionElement(section, sectionIndex, project) {
    const sectionElement = document.createElement('div');
    sectionElement.className = `section-editor ${section.isHeader ? 'header-section' : ''}`;
    sectionElement.dataset.id = section.id;
    
    const contentHtml = generateSectionContentHtml(section, sectionIndex);
    
    // Determine control disable states for header immutability.  A header
    // cannot be moved up or down, nor deleted.  Non-header sections still
    // respect boundaries (first section cannot move up; last cannot move down).
    const isHeader = section.isHeader === true;
    const upDisabled = isHeader || sectionIndex === 0 ? 'disabled' : '';
    const downDisabled = isHeader || sectionIndex === project.sections.length - 1 ? 'disabled' : '';
    const deleteControl = isHeader ? '' : `<button class="icon-btn danger" onclick="deleteSection(${sectionIndex})" title="Delete section">🗑</button>`;

    // Build the title group.  If showIcon is explicitly false we omit the icon span.
    const titleGroup = `${section.showIcon === false ? '' : `<span class="section-icon">${section.icon}</span>`}<span class="section-name">${section.name}</span><span class="expand-indicator">▼</span>`;

    // Build options row.  For header we just show a fixed badge; for other sections
    // we show the Show Icon toggle.  The ability to promote a section to header
    // has been removed to prevent accidental scope drift.
    let optionsHtml = '';
    if (isHeader) {
        optionsHtml = `<span class="header-badge" style="padding:4px 8px; background: var(--primary); color: white; border-radius: var(--radius-md); font-size: 12px; font-weight: 600;">Header (fixed)</span>`;
    } else {
        // Show Icon toggle: use an inline onchange handler to update the section's
        // showIcon property. When the checkbox is unchecked the icon will be
        // suppressed from navigation and headings. We intentionally use an inline
        // handler here rather than delegated listeners because it directly
        // associates the checkbox with its section and reliably captures the
        // checked state.  The default state is checked (true) unless
        // explicitly set to false on the section object.
        optionsHtml = `
            <label style="display: flex; align-items: center; gap: 4px; font-size: 14px;">
                <input type="checkbox" ${section.showIcon === false ? '' : 'checked'}
                       data-show-icon="true" data-section-index="${sectionIndex}">
                <span>Show Icon</span>
            </label>
        `;
    }

    // Only show the icon picker for non-header sections.  Header never displays
    // an icon in navigation, so choosing one has no effect.
    const iconPickerHtml = isHeader ? '' : `
        <div class="form-group">
            <label class="form-label">Section Icon</label>
            <div class="emoji-picker" data-section-index="${sectionIndex}">
                ${generateIconPicker(section.icon, sectionIndex)}
            </div>
        </div>`;

    sectionElement.innerHTML = `
        <div class="section-header" onclick="toggleSection('${section.id}')">
            <div class="section-title-group">${titleGroup}</div>
            <div class="section-controls" onclick="event.stopPropagation()">
                <button class="icon-btn" onclick="moveSection(${sectionIndex}, 'up')" ${upDisabled} title="Move up">↑</button>
                <button class="icon-btn" onclick="moveSection(${sectionIndex}, 'down')" ${downDisabled} title="Move down">↓</button>
                ${deleteControl}
            </div>
        </div>
        <div class="section-content" id="section-${section.id}">
            <div class="form-group">
                <label class="form-label">
                    Section Name
                    <span class="info-tooltip" title="This name will appear in the navigation">ℹ️</span>
                </label>
                <input type="text" class="form-input" value="${escapeHtml(section.name)}" onchange="updateSectionName(${sectionIndex}, this.value)" placeholder="Enter section name">
            </div>
            <!-- Section options: header badge & icon visibility -->
            <div class="form-group">
                <label class="form-label">Section Options</label>
                <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                    ${optionsHtml}
                </div>
            </div>
            ${iconPickerHtml}
            ${contentHtml}
            <div class="add-content-container">
                <button class="btn btn-small btn-secondary" onclick="addTextToSection(${sectionIndex})">
                    + Add Text
                </button>
                <button class="btn btn-small btn-secondary" onclick="addImageToSection(${sectionIndex})">
                    + Add Image
                </button>
            </div>
        </div>
    `;
    
    return sectionElement;
}

/**
 * Generate icon picker HTML with accordion
 */
function generateIconPicker(currentIcon, sectionIndex) {
    const icons = ['📄','📝','📬','📊','💬','✅','📚','📧','🎯','💡','📈','⚠️','🔮','🙏','❓','📖',
                   '⭐','🛠️','🗂️','🧪','🧠','🧵','🗞️','🕐','🧭','🗺️','🏷️','🪄','🧰','🔥','📤',
                   '🔗','🖼️','🎥','🎤','🎟️','🧾','📌','📅','📍','☎️','💻','🌐','🧑‍⚕️','🏥','🏫','🏢','🏆','🧪','🧬','🛰️'];
    
    // Group icons by category
    const iconGroups = {
        'Common': icons.slice(0, 16),
        'Tools & Tech': icons.slice(16, 32),
        'Special': icons.slice(32)
    };
    
    let html = `
        <div class="emoji-picker-accordion">
            <button type="button" class="emoji-current" onclick="toggleEmojiPicker(${sectionIndex})">
                <span class="current-icon">${currentIcon}</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="emoji-picker-dropdown" id="emoji-picker-${sectionIndex}" style="display: none;">`;
    
    for (const [groupName, groupIcons] of Object.entries(iconGroups)) {
        html += `
            <div class="emoji-group">
                <div class="emoji-group-title">${groupName}</div>
                <div class="emoji-group-icons">`;
        
        groupIcons.forEach(icon => {
            // Each icon button carries data attributes for delegation.  Do not
            // attach inline event handlers; selection will be handled via
            // a single delegated listener elsewhere.  The active class is
            // applied when the current icon matches.
            html += `
                <button type="button" class="icon-btn ${icon === currentIcon ? 'active' : ''}" 
                        data-icon="${icon.replace(/'/g, "&#39;")}" data-section-index="${sectionIndex}">
                    ${icon}
                </button>`;
        });
        
        html += `
                </div>
            </div>`;
    }
    
    html += `
            </div>
        </div>`;
    
    return html;
}

/**
 * Toggle emoji picker dropdown
 */
function toggleEmojiPicker(sectionIndex) {
    const picker = document.getElementById(`emoji-picker-${sectionIndex}`);
    if (picker) {
        const isOpen = picker.style.display !== 'none';
        // Close all other pickers
        document.querySelectorAll('.emoji-picker-dropdown').forEach(p => {
            p.style.display = 'none';
        });
        // Reset all arrows
        document.querySelectorAll('.dropdown-arrow').forEach(arrow => {
            arrow.style.transform = 'rotate(0deg)';
        });
        
        // Toggle this picker
        picker.style.display = isOpen ? 'none' : 'block';
        
        // Update arrow rotation for this picker
        const arrow = picker.parentElement.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
}

/**
 * Select emoji and update section
 */
function selectEmoji(sectionIndex, icon) {
    const project = window.APP_STATE?.currentProject;
    if (!project) return;
    
    project.sections[sectionIndex].icon = icon;
    
    // Update UI immediately
    const sectionElement = document.querySelector(`.section-editor[data-id="${project.sections[sectionIndex].id}"]`);
    if (sectionElement) {
        // Update header icon
        const iconElement = sectionElement.querySelector('.section-icon');
        if (iconElement) {
            iconElement.textContent = icon;
        }
        // Update current icon in picker
        const currentIcon = sectionElement.querySelector('.emoji-current .current-icon');
        if (currentIcon) {
            currentIcon.textContent = icon;
        }
    }
    
    // Close picker
    toggleEmojiPicker(sectionIndex);
    
    // Update active states
    document.querySelectorAll(`#emoji-picker-${sectionIndex} .icon-btn`).forEach(btn => {
        if (btn.textContent.trim() === icon) {
            btn.classList.add('active');
            btn.style.background = '#f0fdf4';
            btn.style.borderColor = '#16a34a';
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            btn.style.borderColor = '';
        }
    });
    
    if (window.updateProject) window.updateProject();
}

// ===================================================
// HEADER AND ICON VISIBILITY CONTROLS
// ===================================================

/**
 * Promote a section to be the header. Demotes all other sections.
 * After toggling, the header will be moved to the first position by
 * updateProject/enforceHeaderPosition.
 * @param {number} sectionIndex
 */
function makeHeader(sectionIndex) {
    const project = window.APP_STATE?.currentProject;
    if (!project) return;
    project.sections.forEach((section, idx) => {
        section.isHeader = idx === sectionIndex;
    });
    if (window.updateProject) window.updateProject();
    // Rerender sections in editor to reflect new header position and controls
    renderSections(project);
}

/**
 * Toggle visibility of a section's icon. When false, the icon is hidden
 * from navigation and headings.
 * @param {number} sectionIndex
 * @param {boolean} show
 */
function toggleSectionIcon(sectionIndex, show) {
    const project = window.APP_STATE?.currentProject;
    if (!project) return;
    if (!project.sections[sectionIndex]) return;
    // Explicitly set showIcon property; undefined is treated as true by default
    project.sections[sectionIndex].showIcon = !!show;
    if (window.updateProject) window.updateProject();
    renderSections(project);
}

// Make these functions globally accessible for inline handlers
window.makeHeader = makeHeader;
window.toggleSectionIcon = toggleSectionIcon;

// ---------------------------------------------------
// ICON PICKER DELEGATED EVENT HANDLER
//
// Replace inline onclick handlers on each emoji button with a single
// delegated listener.  Each icon button carries data attributes:
// `data-section-index` and `data-icon`.  When clicked, update the
// corresponding section's icon, re-render the editor and refresh the
// preview.  This avoids scope and escaping issues from inline event
// attributes and ensures skin-tone modifiers or special unicode
// characters are processed correctly.
document.addEventListener('click', function(event) {
    const target = event.target;
    if (!target) return;
    // Find a button with icon data attributes
    const button = target.closest('button.icon-btn[data-icon][data-section-index]');
    if (!button) return;
    const icon = button.getAttribute('data-icon');
    const sectionIndexStr = button.getAttribute('data-section-index');
    if (icon == null || sectionIndexStr == null) return;
    const idx = parseInt(sectionIndexStr, 10);
    if (Number.isNaN(idx)) return;
    // Update the section's icon
    const project = window.APP_STATE?.currentProject;
    if (!project || !project.sections || !project.sections[idx]) return;
    project.sections[idx].icon = icon;
    // Re-render sections to reflect the active state and persist change
    if (typeof renderSections === 'function') {
        renderSections(project);
    }
    if (typeof updateProject === 'function') {
        updateProject();
    }
    // Prevent further propagation (e.g. avoid closing accordion prematurely)
    event.stopPropagation();
});

// No delegated event handler is required for the Show Icon toggle.  Each
// checkbox uses an inline onchange handler defined in createSectionElement()
// to call toggleSectionIcon() directly with the current section index and
// the checkbox state.  This ensures immediate and reliable updates without
// having to manage data attributes or global change listeners.
//
// NOTE: In practice, inline handlers for the Show Icon toggle proved
// unreliable in some scenarios (e.g. sandboxed environments).  To ensure
// consistent behaviour, we attach a delegated `change` event listener on
// the document.  It listens for changes on any checkbox with the
// `data-show-icon` attribute, reads the associated section index, and
// updates the section's `showIcon` property accordingly.  After
// updating, we re-render the sections and refresh the project state to
// reflect the change in both the editor and preview.

document.addEventListener('change', function(event) {
    const target = event.target;
    if (!target) return;
    // Only handle checkboxes that explicitly opt in via data-show-icon
    if (!target.matches('input[type="checkbox"][data-show-icon]')) return;
    const idxStr = target.getAttribute('data-section-index');
    if (!idxStr) return;
    const idx = parseInt(idxStr, 10);
    if (Number.isNaN(idx)) return;
    const project = window.APP_STATE?.currentProject;
    if (!project || !Array.isArray(project.sections) || !project.sections[idx]) return;
    project.sections[idx].showIcon = !!target.checked;
    if (typeof renderSections === 'function') {
        renderSections(project);
    }
    if (typeof updateProject === 'function') {
        updateProject();
    }
});

/**
 * Generate HTML for section content blocks
 */
function generateSectionContentHtml(section, sectionIndex) {
    let contentHtml = '<div class="content-blocks-container">';
    
    if (!section.content || section.content.length === 0) {
        contentHtml += '<p style="text-align: center; color: #999; padding: 20px;">No content yet. Add text or images below.</p>';
    } else {
        section.content.forEach((content, contentIndex) => {
            if (content.type === 'text') {
                contentHtml += generateTextBlockHtml(content, sectionIndex, contentIndex, section.content.length);
            } else if (content.type === 'image') {
                contentHtml += generateImageBlockHtml(content, sectionIndex, contentIndex, section.content.length);
            }
        });
    }
    
    contentHtml += '</div>';
    return contentHtml;
}

/**
 * Generate HTML for a text content block
 */
function generateTextBlockHtml(content, sectionIndex, contentIndex, totalContent) {
    const contentId = content.id || createUniqueId();
    
    return `
        <div class="content-block" data-content-id="${contentId}">
            <div class="content-block-header">
                <div class="content-block-title">📝 Text Block ${contentIndex + 1}</div>
                <div class="content-block-controls">
                    <button class="icon-btn" onclick="moveContent(${sectionIndex}, ${contentIndex}, 'up')" ${contentIndex === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="icon-btn" onclick="moveContent(${sectionIndex}, ${contentIndex}, 'down')" ${contentIndex === totalContent - 1 ? 'disabled' : ''} title="Move down">↓</button>
                    <button class="icon-btn danger" onclick="deleteContent(${sectionIndex}, ${contentIndex})" title="Delete block">🗑</button>
                </div>
            </div>
            <div class="html-toggle">
                <input type="checkbox" id="html-${sectionIndex}-${contentIndex}" ${content.allowHtml ? 'checked' : ''} 
                       onchange="toggleHtml(${sectionIndex}, ${contentIndex}, this.checked)">
                <label for="html-${sectionIndex}-${contentIndex}">⚠️ Enable HTML Mode (Advanced users only)</label>
            </div>
            ${generateRichEditorHtml(sectionIndex, contentIndex, content.value || '')}
        </div>
    `;
}

/**
 * Generate HTML for an image content block
 */
function generateImageBlockHtml(content, sectionIndex, contentIndex, totalContent) {
    const contentId = content.id || createUniqueId();
    
    return `
        <div class="content-block" data-content-id="${contentId}">
            <div class="content-block-header">
                <div class="content-block-title">🖼️ Image Block ${contentIndex + 1}</div>
                <div class="content-block-controls">
                    <button class="icon-btn" onclick="moveContent(${sectionIndex}, ${contentIndex}, 'up')" ${contentIndex === 0 ? 'disabled' : ''} title="Move up">↑</button>
                    <button class="icon-btn" onclick="moveContent(${sectionIndex}, ${contentIndex}, 'down')" ${contentIndex === totalContent - 1 ? 'disabled' : ''} title="Move down">↓</button>
                    <button class="icon-btn danger" onclick="deleteContent(${sectionIndex}, ${contentIndex})" title="Delete block">🗑</button>
                </div>
            </div>
            <div class="image-container">
                ${content.url ? 
                    `<img src="${content.url}" class="image-preview" alt="Section image" onclick="document.getElementById('img-${sectionIndex}-${contentIndex}').click()">
                     <p style="text-align: center; color: #999; font-size: 12px; margin-top: 8px;">Click image to replace</p>` :
                    `<div class="image-upload-area" onclick="document.getElementById('img-${sectionIndex}-${contentIndex}').click()">
                        <div>📷 Click to upload image</div>
                    </div>`
                }
                <input type="file" id="img-${sectionIndex}-${contentIndex}" accept="image/*" 
                       onchange="handleImageUpload(${sectionIndex}, ${contentIndex}, event)" style="display: none;">
                <div class="image-caption-container">
                    <label class="image-caption-label">Caption (optional):</label>
                    ${generateCaptionEditorHtml(sectionIndex, contentIndex, content.caption || '')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate rich text editor HTML
 */
function generateRichEditorHtml(sectionIndex, contentIndex, value) {
    return `
        <div class="rich-editor">
            <div class="editor-toolbar" id="toolbar-${sectionIndex}-${contentIndex}">
                <button class="toolbar-btn" onclick="formatText('bold', ${sectionIndex}, ${contentIndex})" title="Bold (Ctrl+B)"><b>B</b></button>
                <button class="toolbar-btn" onclick="formatText('italic', ${sectionIndex}, ${contentIndex})" title="Italic (Ctrl+I)"><i>I</i></button>
                <button class="toolbar-btn" onclick="formatText('underline', ${sectionIndex}, ${contentIndex})" title="Underline (Ctrl+U)"><u>U</u></button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="formatText('insertUnorderedList', ${sectionIndex}, ${contentIndex})" title="Bullet List">•</button>
                <button class="toolbar-btn" onclick="formatText('insertOrderedList', ${sectionIndex}, ${contentIndex})" title="Numbered List">1.</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="formatText('superscript', ${sectionIndex}, ${contentIndex})" title="Superscript">X²</button>
                <button class="toolbar-btn" onclick="formatText('subscript', ${sectionIndex}, ${contentIndex})" title="Subscript">X₂</button>
                <div class="toolbar-separator"></div>
                <button class="toolbar-btn" onclick="insertLink(${sectionIndex}, ${contentIndex})" title="Insert Link">🔗</button>
                <button class="toolbar-btn" onclick="formatText('removeFormat', ${sectionIndex}, ${contentIndex})" title="Clear Formatting">✖</button>
                <div class="toolbar-separator"></div>
                <select class="toolbar-select" onchange="formatText('fontSize', ${sectionIndex}, ${contentIndex}, this.value); this.value=''">
                    <option value="">Size</option>
                    <option value="1">Small</option>
                    <option value="3">Normal</option>
                    <option value="5">Large</option>
                    <option value="7">X-Large</option>
                </select>
                <select class="toolbar-select" onchange="formatText('formatBlock', ${sectionIndex}, ${contentIndex}, this.value); this.value=''">
                    <option value="">Style</option>
                    <option value="p">Paragraph</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                    <option value="h3">Heading 3</option>
                    <option value="blockquote">Quote</option>
                </select>
            </div>
            <div class="editor-content-area" 
                 contenteditable="true" 
                 id="editor-${sectionIndex}-${contentIndex}"
                 onblur="updateContentValue(${sectionIndex}, ${contentIndex}, this.innerHTML)"
                 onpaste="handlePaste(event, ${sectionIndex}, ${contentIndex})">${value || '<p>Start typing here...</p>'}</div>
        </div>
    `;
}

/**
 * Generate caption editor HTML
 */
function generateCaptionEditorHtml(sectionIndex, contentIndex, caption) {
    return `
        <div class="rich-editor">
            <div class="editor-toolbar">
                <button class="toolbar-btn" onclick="formatCaption('bold', ${sectionIndex}, ${contentIndex})" title="Bold"><b>B</b></button>
                <button class="toolbar-btn" onclick="formatCaption('italic', ${sectionIndex}, ${contentIndex})" title="Italic"><i>I</i></button>
                <button class="toolbar-btn" onclick="formatCaption('underline', ${sectionIndex}, ${contentIndex})" title="Underline"><u>U</u></button>
                <button class="toolbar-btn" onclick="formatCaption('superscript', ${sectionIndex}, ${contentIndex})" title="Superscript">X²</button>
                <button class="toolbar-btn" onclick="insertCaptionLink(${sectionIndex}, ${contentIndex})" title="Insert Link">🔗</button>
            </div>
            <div class="editor-content-area" 
                 contenteditable="true" 
                 id="caption-${sectionIndex}-${contentIndex}"
                 style="min-height: 60px;"
                 onblur="updateImageCaption(${sectionIndex}, ${contentIndex}, this.innerHTML)"
                 placeholder="Enter image caption...">${caption || ''}</div>
        </div>
    `;
}

// ===================================================
// SECTION INTERACTIONS
// ===================================================

/**
 * Toggle section expansion
 */
function toggleSection(sectionId) {
    const content = document.getElementById(`section-${sectionId}`);
    const section = document.querySelector(`.section-editor[data-id="${sectionId}"]`);
    const indicator = section?.querySelector('.expand-indicator');
    
    if (!content || !indicator) return;
    
    content.classList.toggle('expanded');
    
    // Update indicator rotation
    if (content.classList.contains('expanded')) {
        indicator.style.transform = 'rotate(180deg)';
    } else {
        indicator.style.transform = 'rotate(0deg)';
    }
}

/**
 * Add new section to project
 */
function addSection(project, onUpdate) {
    const newSection = {
        id: `section-${Date.now()}`,
        icon: '📄',
        name: 'New Section',
        content: [],
        // New sections show their icon by default. Explicitly storing this
        // property avoids issues where undefined is interpreted as false.
        showIcon: true
    };
    
    project.sections.push(newSection);
    renderSections(project);
    
    // Auto-expand the new section
    setTimeout(() => {
        expandSection(newSection.id);
        // Scroll to the new section
        const sectionElement = document.querySelector(`.section-editor[data-id="${newSection.id}"]`);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
    
    if (onUpdate) onUpdate();
    if (window.LWB_Utils) window.LWB_Utils.showToast('Section added', 'success');
}

/**
 * Delete a section
 */
function deleteSection(project, index, onUpdate) {
    // Don't delete if it's the only section
    if (project.sections.length <= 1) {
        if (window.LWB_Utils) window.LWB_Utils.showToast('Cannot delete the last section', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this section? This cannot be undone.')) return;
    
    project.sections.splice(index, 1);
    renderSections(project);
    
    if (onUpdate) onUpdate();
    if (window.LWB_Utils) window.LWB_Utils.showToast('Section deleted', 'success');
}

/**
 * Move section up or down
 */
function moveSection(project, index, direction, onUpdate) {
    const sections = project.sections;
    
    if (direction === 'up' && index > 0) {
        [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
    } else if (direction === 'down' && index < sections.length - 1) {
        [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
    } else {
        return; // Can't move
    }
    
    // Store expanded state
    const sectionId = sections[index].id;
    const wasExpanded = document.getElementById(`section-${sectionId}`)?.classList.contains('expanded');
    
    renderSections(project);
    
    // Restore expanded state
    if (wasExpanded) {
        expandSection(sectionId);
    }
    
    if (onUpdate) onUpdate();
}

/**
 * Update section name
 */
function updateSectionName(project, index, value, onUpdate) {
    if (!value.trim()) {
        if (window.LWB_Utils) window.LWB_Utils.showToast('Section name cannot be empty', 'error');
        return;
    }
    
    project.sections[index].name = value;
    
    // Update header without re-rendering everything
    const sectionHeader = document.querySelector(`.section-editor[data-id="${project.sections[index].id}"] .section-name`);
    if (sectionHeader) {
        sectionHeader.textContent = value;
    }
    
    if (onUpdate) onUpdate();
}

// ===================================================
// CONTENT MANAGEMENT
// ===================================================

/**
 * Add text content to section
 */
function addTextToSection(project, sectionIndex, onUpdate) {
    if (!project.sections[sectionIndex].content) {
        project.sections[sectionIndex].content = [];
    }
    
    project.sections[sectionIndex].content.push({
        type: 'text',
        value: '<p>New text content...</p>',
        allowHtml: false,
        id: createUniqueId()
    });
    
    const sectionId = project.sections[sectionIndex].id;
    renderSections(project);
    
    // Keep section expanded
    expandSection(sectionId);
    
    if (onUpdate) onUpdate();
    if (window.LWB_Utils) window.LWB_Utils.showToast('Text block added', 'success');
}

/**
 * Add image content to section
 */
function addImageToSection(project, sectionIndex, onUpdate) {
    if (!project.sections[sectionIndex].content) {
        project.sections[sectionIndex].content = [];
    }
    
    project.sections[sectionIndex].content.push({
        type: 'image',
        url: null,
        caption: '',
        id: createUniqueId()
    });
    
    const sectionId = project.sections[sectionIndex].id;
    renderSections(project);
    
    // Keep section expanded
    expandSection(sectionId);
    
    if (onUpdate) onUpdate();
    if (window.LWB_Utils) window.LWB_Utils.showToast('Image block added', 'success');
}

/**
 * Delete content from section
 */
function deleteContent(project, sectionIndex, contentIndex, onUpdate) {
    if (!confirm('Are you sure you want to delete this content block?')) return;
    
    const sectionId = project.sections[sectionIndex].id;
    
    project.sections[sectionIndex].content.splice(contentIndex, 1);
    renderSections(project);
    
    expandSection(sectionId);
    
    if (onUpdate) onUpdate();
    if (window.LWB_Utils) window.LWB_Utils.showToast('Content block deleted', 'success');
}

/**
 * Move content within section
 */
function moveContent(project, sectionIndex, contentIndex, direction, onUpdate) {
    const content = project.sections[sectionIndex].content;
    
    if (direction === 'up' && contentIndex > 0) {
        [content[contentIndex], content[contentIndex - 1]] = [content[contentIndex - 1], content[contentIndex]];
    } else if (direction === 'down' && contentIndex < content.length - 1) {
        [content[contentIndex], content[contentIndex + 1]] = [content[contentIndex + 1], content[contentIndex]];
    } else {
        return; // Can't move
    }
    
    const sectionId = project.sections[sectionIndex].id;
    renderSections(project);
    expandSection(sectionId);
    
    if (onUpdate) onUpdate();
}

// ===================================================
// RICH TEXT EDITING
// ===================================================

/**
 * Format text in rich editor
 */
function formatText(command, sectionIndex, contentIndex, value = null, project, onUpdate) {
    const editor = document.getElementById(`editor-${sectionIndex}-${contentIndex}`);
    if (!editor) return;
    
    editor.focus();
    
    // Handle special commands
    if (command === 'fontSize' && value) {
        document.execCommand(command, false, value);
    } else if (command === 'formatBlock' && value) {
        document.execCommand(command, false, value);
    } else {
        document.execCommand(command, false, value);
    }
    
    // Update stored value
    if (project && project.sections[sectionIndex]) {
        project.sections[sectionIndex].content[contentIndex].value = editor.innerHTML;
    }
    
    if (onUpdate) onUpdate();
}

/**
 * Insert link in text editor
 */
function insertLink(sectionIndex, contentIndex, project, onUpdate) {
    const editor = document.getElementById(`editor-${sectionIndex}-${contentIndex}`);
    if (!editor) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    const url = prompt('Enter URL:', 'https://');
    if (url && url !== 'https://') {
        editor.focus();
        
        if (selectedText) {
            document.execCommand('createLink', false, url);
        } else {
            const linkText = prompt('Enter link text:', 'Link');
            if (linkText) {
                document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${linkText}</a>`);
            }
        }
        
        if (project && project.sections[sectionIndex]) {
            project.sections[sectionIndex].content[contentIndex].value = editor.innerHTML;
        }
        
        if (onUpdate) onUpdate();
    }
}

/**
 * Handle paste event to clean HTML
 */
function handlePaste(event, sectionIndex, contentIndex) {
    event.preventDefault();
    
    const text = event.clipboardData.getData('text/plain');
    const html = event.clipboardData.getData('text/html');
    
    // If HTML is available and not from Word, use it
    if (html && !html.includes('mso-')) {
        // Clean the HTML
        const cleaned = cleanPastedHtml(html);
        document.execCommand('insertHTML', false, cleaned);
    } else {
        // Otherwise use plain text
        document.execCommand('insertText', false, text);
    }
}

/**
 * Clean pasted HTML
 */
function cleanPastedHtml(html) {
    // Create a temporary element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove script tags
    temp.querySelectorAll('script').forEach(el => el.remove());
    
    // Remove style tags
    temp.querySelectorAll('style').forEach(el => el.remove());
    
    // Remove all style attributes
    temp.querySelectorAll('*').forEach(el => {
        el.removeAttribute('style');
        el.removeAttribute('class');
        el.removeAttribute('id');
    });
    
    return temp.innerHTML;
}

/**
 * Update content value
 */
function updateContentValue(project, sectionIndex, contentIndex, value, onUpdate) {
    if (project && project.sections[sectionIndex]) {
        project.sections[sectionIndex].content[contentIndex].value = value;
        if (onUpdate) onUpdate();
    }
}

/**
 * Toggle HTML mode for content
 */
function toggleHtml(project, sectionIndex, contentIndex, enabled, onUpdate) {
    if (project && project.sections[sectionIndex]) {
        project.sections[sectionIndex].content[contentIndex].allowHtml = enabled;
        
        if (enabled && window.LWB_Utils) {
            window.LWB_Utils.showToast('⚠️ HTML mode enabled - Be careful with external content', 'error');
        }
        
        if (onUpdate) onUpdate();
    }
}

// ===================================================
// IMAGE HANDLING
// ===================================================

/**
 * Handle image upload for content block
 */
function handleImageUpload(project, sectionIndex, contentIndex, event, onUpdate) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate image
    if (!file.type.startsWith('image/')) {
        if (window.LWB_Utils) window.LWB_Utils.showToast('Please upload an image file', 'error');
        return;
    }
    
    // Max size 10MB
    if (file.size > 10 * 1024 * 1024) {
        if (window.LWB_Utils) window.LWB_Utils.showToast('Image too large. Maximum size is 10MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const sectionId = project.sections[sectionIndex].id;
        
        if (project && project.sections[sectionIndex]) {
            project.sections[sectionIndex].content[contentIndex].url = e.target.result;
        }
        
        renderSections(project);
        expandSection(sectionId);
        
        if (onUpdate) onUpdate();
        if (window.LWB_Utils) window.LWB_Utils.showToast('Image uploaded successfully', 'success');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Update image caption
 */
function updateImageCaption(project, sectionIndex, contentIndex, caption, onUpdate) {
    if (project && project.sections[sectionIndex]) {
        project.sections[sectionIndex].content[contentIndex].caption = caption;
        if (onUpdate) onUpdate();
    }
}

/**
 * Format image caption
 */
function formatCaption(command, sectionIndex, contentIndex, project, onUpdate) {
    const caption = document.getElementById(`caption-${sectionIndex}-${contentIndex}`);
    if (!caption) return;
    
    caption.focus();
    document.execCommand(command, false, null);
    
    // Update stored value
    if (project && project.sections[sectionIndex]) {
        project.sections[sectionIndex].content[contentIndex].caption = caption.innerHTML;
    }
    
    if (onUpdate) onUpdate();
}

/**
 * Insert link in caption
 */
function insertCaptionLink(sectionIndex, contentIndex, project, onUpdate) {
    const caption = document.getElementById(`caption-${sectionIndex}-${contentIndex}`);
    if (!caption) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    const url = prompt('Enter URL:', 'https://');
    if (url && url !== 'https://') {
        caption.focus();
        
        if (selectedText) {
            document.execCommand('createLink', false, url);
        } else {
            const linkText = prompt('Enter link text:', 'Link');
            if (linkText) {
                document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${linkText}</a>`);
            }
        }
        
        if (project && project.sections[sectionIndex]) {
            project.sections[sectionIndex].content[contentIndex].caption = caption.innerHTML;
        }
        
        if (onUpdate) onUpdate();
    }
}

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

/**
 * Create a unique ID
 */
function createUniqueId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Expand a specific section
 */
function expandSection(sectionId) {
    const sectionContent = document.getElementById(`section-${sectionId}`);
    if (sectionContent) {
        sectionContent.classList.add('expanded');
        const section = document.querySelector(`.section-editor[data-id="${sectionId}"]`);
        const indicator = section?.querySelector('.expand-indicator');
        if (indicator) {
            indicator.style.transform = 'rotate(180deg)';
        }
    }
}

// ===================================================
// EXPORTS
// ===================================================

// Make functions available globally for the modular system
window.LWB_Editor = {
    // Section management
    renderSections,
    addSection,
    deleteSection,
    moveSection,
    updateSectionName,
    toggleSection,
    expandSection,
    
    // Content management
    addTextToSection,
    addImageToSection,
    deleteContent,
    moveContent,
    updateContentValue,
    toggleHtml,
    
    // Rich text editing
    formatText,
    insertLink,
    formatCaption,
    insertCaptionLink,
    handlePaste,
    
    // Image handling
    handleImageUpload,
    updateImageCaption,
    
    // Utilities
    createUniqueId,
    escapeHtml
};

// Make new emoji functions globally available
window.toggleEmojiPicker = toggleEmojiPicker;
window.selectEmoji = selectEmoji;
