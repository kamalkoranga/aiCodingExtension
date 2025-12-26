// Content script for AlgoSpark Extension

// Check if extension context is still valid
function isExtensionContextValid() {
    try {
        return chrome.runtime && chrome.runtime.id;
    } catch (error) {
        return false;
    }
}

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        if (request.action === 'getSelectedText') {
            const selectedText = getSelectedText();
            sendResponse({ selectedText: selectedText });
        } else if (request.action === 'getEditorCode') {
            const editorCode = getEditorCode();
            sendResponse({ editorCode });
        } else if (request.action === 'getLeetCodeContext') {
            const selectedText = getSelectedText();
            const editorCode = getEditorCode();
            sendResponse({ selectedText, editorCode });
        }
    } catch (error) {
        console.log('Content script message error:', error);
        // Don't send response if context is invalidated
    }
});

// Function to get currently selected text
function getSelectedText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        return selection.toString().trim();
    }
    return '';
}

// Try to extract code from common editors (LeetCode uses Monaco)
function getEditorCode() {
    try {
        // Monaco
        if (window.monaco && window.monaco.editor && typeof window.monaco.editor.getModels === 'function') {
            const models = window.monaco.editor.getModels();
            if (models && models.length > 0) {
                const value = models[0].getValue();
                if (value && value.trim()) return value;
            }
        }
    } catch (_) {}

    try {
        // CodeMirror
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl && cmEl.CodeMirror && typeof cmEl.CodeMirror.getValue === 'function') {
            const value = cmEl.CodeMirror.getValue();
            if (value && value.trim()) return value;
        }
    } catch (_) {}

    try {
        // Fallback: look for visible code textarea/contenteditable
        const ta = document.querySelector('textarea[aria-label="Code editor"], textarea');
        if (ta && ta.value && ta.value.trim()) return ta.value;
    } catch (_) {}

    return '';
}

// Add visual indicator when text is selected
document.addEventListener('mouseup', () => {
    const selectedText = getSelectedText();
    if (selectedText && selectedText.length > 10) {
        // Remove existing indicator
        const existingIndicator = document.getElementById('code-assistant-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Add new indicator
        const indicator = document.createElement('div');
        indicator.id = 'code-assistant-indicator';
        indicator.innerHTML = '🤖 Right-click to analyze code';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-family: 'Segoe UI', sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            cursor: pointer;
            animation: slideIn 0.3s ease-out;
        `;

        // Add animation keyframes
        if (!document.getElementById('code-assistant-styles')) {
            const style = document.createElement('style');
            style.id = 'code-assistant-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(indicator);

        // Auto-send selection to extension and open popup (no click needed)
        try {
            const editorCode = getEditorCode();
            chrome.runtime.sendMessage({ 
                action: 'analyzeCode', 
                selectedText: selectedText,
                editorCode: editorCode
            });
        } catch (_) {}

        // Auto-hide after 1.5 seconds
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.remove();
                    }
                }, 300);
            }
        }, 1500);

        // Click to open popup (optional)
        indicator.addEventListener('click', () => {
            if (!isExtensionContextValid()) {
                indicator.remove();
                return;
            }
            try { chrome.runtime.sendMessage({ action: 'openPopup' }); } catch (_) { indicator.remove(); }
        });
    }
});

// Handle keyboard shortcut
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+Space
    if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        const selectedText = getSelectedText();
        if (selectedText) {
            if (!isExtensionContextValid()) {
                console.log('Extension context invalidated, keyboard shortcut failed');
                return;
            }
            try {
                chrome.runtime.sendMessage({ 
                    action: 'analyzeCode', 
                    selectedText: selectedText 
                });
            } catch (error) {
                console.log('Extension context invalidated, keyboard shortcut failed');
            }
        }
    }
});

// Detect code blocks and add analyze buttons
function addCodeBlockButtons() {
    const codeBlocks = document.querySelectorAll('pre code, code, .highlight, .code-block');
    
    codeBlocks.forEach((block, index) => {
        if (block.dataset.analyzeButton) return; // Already has button
        
        const button = document.createElement('button');
        button.innerHTML = '🤖 Analyze';
        button.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            cursor: pointer;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Make parent container relative positioned
        const parent = block.closest('pre') || block.parentElement;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(button);
            
            // Show button on hover
            parent.addEventListener('mouseenter', () => {
                button.style.opacity = '1';
            });
            
            parent.addEventListener('mouseleave', () => {
                button.style.opacity = '0';
            });
            
            // Handle button click
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const codeText = block.textContent || block.innerText;
                if (!isExtensionContextValid()) {
                    console.log('Extension context invalidated, removing button');
                    button.remove();
                    return;
                }
                try {
                    chrome.runtime.sendMessage({ 
                        action: 'analyzeCode', 
                        selectedText: codeText 
                    });
                } catch (error) {
                    console.log('Extension context invalidated, button click failed');
                    button.remove();
                }
            });
            
            block.dataset.analyzeButton = 'true';
        }
    });
}

// Add buttons to existing code blocks
addCodeBlockButtons();

// Watch for new code blocks being added
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            addCodeBlockButtons();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
