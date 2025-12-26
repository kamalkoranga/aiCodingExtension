// Popup script for AlgoSpark Extension
class CodeAssistant {
  constructor() {
    this.init();
  }

  async init() {
    // Set up event listeners
    this.setupEventListeners();

    // Load selected text if available
    await this.loadSelectedText();
  }

  setupEventListeners() {
    try {
      console.log('Setting up event listeners...');

      // Tab switching
      const tabButtons = document.querySelectorAll('.tab-button');
      console.log('Found tab buttons:', tabButtons.length);
      tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          console.log('Tab clicked:', e.target.dataset.tab);
          this.switchTab(e.target.dataset.tab);
        });
      });

      // Analyze buttons
      const analyzeButtons = [
        { id: 'hintsBtn', type: 'hints' },
        { id: 'suggestionsBtn', type: 'suggestions' },
        { id: 'explanationBtn', type: 'explanation' },
        { id: 'cleancodeBtn', type: 'cleancode' },
        { id: 'solutionsBtn', type: 'solutions' }
      ];

      analyzeButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        console.log(`Button ${btn.id}:`, element ? 'Found' : 'NOT FOUND');
        if (element) {
          element.addEventListener('click', (e) => {
            console.log(`Analyze button clicked: ${btn.type}`);
            e.preventDefault();
            this.analyzeCode(btn.type);
          });
        } else {
          console.error(`Button not found: ${btn.id}`);
        }
      });

      // Clear buttons
      const clearButtons = [
        { id: 'clearHintsBtn', inputId: 'hintsInput' },
        { id: 'clearSuggestionsBtn', inputId: 'suggestionsInput' },
        { id: 'clearExplanationBtn', inputId: 'explanationInput' },
        { id: 'clearCleancodeBtn', inputId: 'cleancodeInput' },
        { id: 'clearSolutionsBtn', inputId: 'solutionsInput' }
      ];

      clearButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        const inputElement = document.getElementById(btn.inputId);
        if (element && inputElement) {
          element.addEventListener('click', () => {
            inputElement.value = '';
            inputElement.focus();
          });
        }
      });

      // Settings button
      const settingsBtn = document.getElementById('settingsBtn');
      const settingsMenu = document.getElementById('settingsMenu');
      const logoutBtn = document.getElementById('logoutBtn');

      // Toggle menu visibility
      settingsBtn.onclick = function (e) {
        e.stopPropagation();
        if (settingsMenu.style.display === 'block') {
          settingsMenu.style.display = 'none';
        } else {
          settingsMenu.style.display = 'block';
        }
      };

      // Hide menu when clicking outside
      document.addEventListener('click', function (e) {
        if (settingsMenu.style.display === 'block' && !settingsMenu.contains(e.target) && e.target !== settingsBtn) {
          settingsMenu.style.display = 'none';
        }
      });

      // Logout logic
      logoutBtn.onclick = function () {
        localStorage.removeItem('codeAssistantLoggedIn');
        localStorage.removeItem('codeAssistantUserEmail');
        settingsMenu.style.display = 'none';
        showLogin();
      };

      // Character counters
      const textareas = document.querySelectorAll('textarea[id$="Input"]');
      textareas.forEach(textarea => {
        const counterId = textarea.id.replace('Input', 'Counter');
        const counter = document.getElementById(counterId);

        if (counter) {
          const updateCounter = () => {
            counter.textContent = `${textarea.value.length} characters`;
          };

          textarea.addEventListener('input', updateCounter);
          updateCounter(); // Initial count
        }
      });

      // Add keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+C to clear current textarea
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
          e.preventDefault();
          const activeTab = document.querySelector('.tab-panel.active');
          if (activeTab) {
            const textarea = document.getElementById(`${activeTab.id}Input`);
            if (textarea) {
              textarea.value = '';
              textarea.focus();
            }
          }
        }

        // Ctrl+Enter to analyze current tab
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          const activeTab = document.querySelector('.tab-panel.active');
          if (activeTab) {
            this.analyzeCode(activeTab.id);
          }
        }
      });
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  switchTab(tabName) {
    try {
      // Remove active class from all tabs and panels
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

      // Add active class to selected tab and panel
      const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
      const tabPanel = document.getElementById(tabName);

      if (tabButton && tabPanel) {
        tabButton.classList.add('active');
        tabPanel.classList.add('active');
      }
    } catch (error) {
      console.error('Error switching tab:', error);
    }
  }

  async loadSelectedText() {
    try {
      // First try to get selected text from storage (from context menu)
      const result = await chrome.storage.local.get(['selectedText', 'editorCode', 'timestamp']);
      if (result.selectedText && result.timestamp && (Date.now() - result.timestamp < 30000)) {
        // Clear the stored text
        await chrome.storage.local.remove(['selectedText', 'editorCode', 'timestamp']);

        // Fill all textareas with the selected text
        const textareas = document.querySelectorAll('textarea[id$="Input"]');
        textareas.forEach(textarea => {
          // If we captured editor code, append it below the question
          if (result.editorCode) {
            textarea.value = `${result.selectedText}\n\n----\nLeetCode Function Stub:\n\n${result.editorCode}`;
          } else {
            textarea.value = result.selectedText;
          }
        });
        return;
      }

      // Fallback: try to get selected text from content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getLeetCodeContext' });

      if (response && (response.selectedText || response.editorCode)) {
        const activeTab = document.querySelector('.tab-panel.active');
        if (activeTab) {
          const textarea = document.getElementById(`${activeTab.id}Input`) || document.getElementById('hintsInput');
          if (textarea) {
            const question = response.selectedText || '';
            const editor = response.editorCode || '';
            textarea.value = editor ? `${question}\n\n----\nLeetCode Function Stub:\n\n${editor}` : question;
          }
        }
      }
    } catch (error) {
      // Ignore errors - content script might not be loaded
    }
  }

  async analyzeCode(type) {
    console.log('analyzeCode called with type:', type);

    const activeTab = document.querySelector('.tab-panel.active');
    if (!activeTab) {
      this.showError('No active tab found.');
      return;
    }

    const textarea = document.getElementById(`${activeTab.id}Input`) || document.getElementById('hintsInput');
    if (!textarea) {
      this.showError('Text area not found.');
      return;
    }

    const code = textarea.value.trim();

    if (!code) {
      this.showError('Please enter some code to analyze.');
      return;
    }

    this.showLoading(true);

    try {
      const result = await this.callGeminiAPI(code, type);
      this.showResult(result, type);
    } catch (error) {
      console.error('Error analyzing code:', error);
      this.showError(error.message || 'Error analyzing code. Please try again.');
    } finally {
      this.showLoading(false);
    }
  }

  async callGeminiAPI(code, type) {
    console.log('Using backend API for Gemini');
    const prompts = {
      hints: `Provide concise hints for this code. Focus on key concepts and best practices only:\n\n${code}`,
      suggestions: `Provide different ways to solve this problem not code:\n\n${code}`,
      explanation: `Explain this code briefly and clearly:\n\n${code}`,
      cleancode: `Provide clean, optimized code. Return only the refactored code without comments or explanations:\n\n${code}`,
      solutions: `Provide a complete, working solution code. Return only the full working code without comments or explanations. Make sure the code is complete and functional:\n\n${code}`,
    };

    try {
      // Get the current user email from the loginEmail input or localStorage
      let userEmail = '';
      userEmail = localStorage.getItem('codeAssistantUserEmail') || '';

      console.log('User email for API:', userEmail);

      const response = await fetch("https://api-sand-two-62.vercel.app/api/ask", {
      // const response = await fetch("http://127.0.0.1:5000/api/ask", {
      
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: prompts[type] || code,
          mode: type,
          email: userEmail
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      return data.result;
    } catch (error) {
      console.error('Error calling backend API:', error);
      throw error;
    }
  }

  showResult(result, type) {
    const resultDiv = document.getElementById(`${type}Result`) ||
      document.querySelector('.result-section');
    resultDiv.style.display = 'block';

    if (resultDiv) {
      // Format the result with proper code highlighting
      const formattedResult = this.formatCodeResult(result, type);

      resultDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 style="color: white; margin: 0;">${this.getTypeTitle(type)}</h3>
                    <div style="display: flex; gap: 5px;">
                    </div>
                </div>
                <div id="resultContent-${type}">${formattedResult}</div>
            `;

      // Add copy functionality
      const copyBtn = document.getElementById(`copyBtn-${type}`);
      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.copyToClipboard(result, copyBtn);
        });
      }

      // Wire up code block copy buttons
      const codeCopyButtons = resultDiv.querySelectorAll('.copy-code-btn');
      codeCopyButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
          const container = btn.closest('.code-container');
          const codeEl = container ? container.querySelector('pre.code-block code') : null;
          const rawAttr = btn.getAttribute('data-raw');
          const raw = rawAttr ? decodeURIComponent(rawAttr) : (codeEl ? codeEl.textContent : '');
          try {
            await navigator.clipboard.writeText(raw);
            const original = btn.textContent;
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = original; }, 1500);
          } catch (e) {
            const original = btn.textContent;
            btn.textContent = '❌';
            setTimeout(() => { btn.textContent = original; }, 1500);
          }
        });
      });
    }
  }

  async copyToClipboard(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = button.innerHTML;
      button.innerHTML = '✅';
      button.style.background = '#28a745';

      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      button.innerHTML = '❌';
      setTimeout(() => {
        button.innerHTML = '📋';
      }, 2000);
    }
  }

  getTypeTitle(type) {
    const titles = {
      hints: '💡 Code Hints',
      suggestions: '💭 Improvement Suggestions',
      explanation: '📚 Code Explanation',
      cleancode: '✨ Clean Code Suggestions',
      solutions: '🎯 Solution Approaches',
    };
    return titles[type] || 'Analysis Result';
  }

  showError(message) {
    try {
      const activeTab = document.querySelector('.tab-panel.active');
      if (activeTab) {
        const resultDiv = document.getElementById(`${activeTab.id}Result`);
        if (resultDiv) {
          resultDiv.innerHTML = `<p style="color: red; text-align: center; margin: 20px 0;">❌ ${message}</p>`;
        }
      }
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  }

  showLoading(show) {
    try {
      const loading = document.getElementById('loading');
      if (loading) {
        loading.style.display = show ? 'block' : 'none';
      }
    } catch (error) {
      console.error('Error showing loading:', error);
    }
  }

  isResponseIncomplete(responseText, type) {
    if (!responseText || responseText.length < 50) {
      return true;
    }

    // Check for common incomplete response patterns
    const incompletePatterns = [
      /\.\.\.$/,
      /etc\.$/,
      /and so on$/,
      /more\.\.\.$/,
      /continued\.\.\.$/,
      /to be continued$/,
      /part \d+ of \d+$/i,
      /truncated$/i
    ];

    const trimmedResponse = responseText.trim();
    const lastSentence = trimmedResponse.split(/[.!?]/).pop().trim();

    for (const pattern of incompletePatterns) {
      if (pattern.test(lastSentence)) {
        return true;
      }
    }

    // Check if response is too short for the type
    const minLengths = {
      hints: 100,
      suggestions: 150,
      explanation: 200,
      cleancode: 150,
      solutions: 200,
    };

    if (trimmedResponse.length < minLengths[type]) {
      return true;
    }

    return false;
  }

  cleanCodeResponse(text) {
    // Remove common explanation patterns
    const lines = text.split('\n');
    const codeLines = [];
    let inCodeBlock = false;

    for (const line of lines) {
      // Skip explanation lines
      if (line.startsWith('Here') || line.startsWith('This') ||
        line.startsWith('The') || line.startsWith('//') ||
        line.startsWith('/*') || line.startsWith('*') ||
        line.includes('explanation') || line.includes('description')) {
        continue;
      }

      // Keep code blocks
      if (line.startsWith('```') || line.includes('function') ||
        line.includes('class') || line.includes('const') ||
        line.includes('let') || line.includes('var') ||
        line.includes('if') || line.includes('for') ||
        line.includes('while') || line.includes('return')) {
        codeLines.push(line);
      }
    }

    return codeLines.join('\n').trim();
  }

  formatCodeResult(result, type) {
    // For code-focused types, format with syntax highlighting
    if (['suggestions', 'cleancode', 'solutions'].includes(type)) {
      return this.formatCodeBlock(result);
    }

    // For other types, check if result contains code blocks
    if (result.includes('```') || result.includes('function') || result.includes('class')) {
      return this.formatMixedContent(result);
    }

    // Regular text formatting
    return `<div style="white-space: pre-wrap; line-height: 1.6;">${result}</div>`;
  }

  formatCodeBlock(code) {
    // Clean up the code
    let cleanCode = code.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
    const originalCode = cleanCode;

    // Basic syntax highlighting for JavaScript/Python/Java
    cleanCode = this.addSyntaxHighlighting(cleanCode);

    return `
            <div class="code-container">
                <div class="code-header">
                    <span class="code-lang">Code</span>
                    <button class="copy-code-btn" data-raw="${encodeURIComponent(originalCode)}">📋</button>
                </div>
                <pre class="code-block"><code>${cleanCode}</code></pre>
            </div>
        `;
  }

  formatMixedContent(content) {
    // Split content into text and code blocks
    const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g);
    let formatted = '';

    for (const part of parts) {
      if (part.startsWith('```')) {
        // This is a code block
        const code = part.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
        const highlightedCode = this.addSyntaxHighlighting(code);
        formatted += `
                    <div class="code-container">
                        <div class="code-header">
                            <span class="code-lang">Code</span>
                            <button class="copy-code-btn" data-raw="${encodeURIComponent(code)}">📋</button>
                        </div>
                        <pre class="code-block"><code>${highlightedCode}</code></pre>
                    </div>
                `;
      } else if (part.trim()) {
        // This is regular text
        formatted += `<div class="text-content">${part}</div>`;
      }
    }

    return formatted;
  }

  addSyntaxHighlighting(code) {
    // Simple approach - just escape HTML and return plain text
    // The CSS will handle the styling
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

// --- Simple Login System ---
const loginModal = document.getElementById('loginModal');
const loginStepEmail = document.getElementById('loginStepEmail');
const loginStepOtp = document.getElementById('loginStepOtp');
const loginEmail = document.getElementById('loginEmail');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const loginOtp = document.getElementById('loginOtp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const loginError = document.getElementById('loginError');

let generatedOtp;
let loggedIn = false;

// Show login modal if not logged in
function showLogin() {
  loginModal.style.display = 'flex';
  loginStepEmail.style.display = '';
  loginStepOtp.style.display = 'none';
  loginError.textContent = '';
  loginEmail.value = '';
  loginOtp.value = '';
}
function hideLogin() {
  loginModal.style.display = 'none';
}

// Simulate OTP sending (now via backend)
sendOtpBtn.onclick = async function () {
  const email = loginEmail.value.trim();
  if (!email || !email.includes('@')) {
    loginError.textContent = 'Please enter a valid email.';
    return;
  }
  loginError.textContent = 'Sending OTP...';
  sendOtpBtn.disabled = true;

  try {
    // Call your backend to send OTP
    const response = await fetch('https://api-sand-two-62.vercel.app/api/send-otp', {
    // const response = await fetch('http://127.0.0.1:5000/api/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      throw new Error('Failed to send OTP. Try again.');
    }
    const data = await response.json();
    if (!data.otp) {
      throw new Error(data.error || 'No OTP received from server.');
    }
    generatedOtp = data.otp; // Store OTP from backend (for demo/dev)
    // In production, do not expose OTP to frontend!
    loginStepEmail.style.display = 'none';
    loginStepOtp.style.display = '';
    loginError.textContent = '';
  } catch (err) {
    loginError.textContent = err.message;
  } finally {
    sendOtpBtn.disabled = false;
  }
};

verifyOtpBtn.onclick = function () {
  if (loginOtp.value.trim() === String(generatedOtp)) {
    loggedIn = true;
    localStorage.setItem('codeAssistantLoggedIn', '1'); // Persist login
    localStorage.setItem('codeAssistantUserEmail', loginEmail.value.trim());

    fetch('https://api-sand-two-62.vercel.app/api/verify-user', {
    // fetch('http://127.0.0.1:5000/api/verify-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value.trim() })
    }).catch(() => { /* Ignore errors for now */ });

    hideLogin();
  } else {
    loginError.textContent = 'Invalid OTP. Please try again.';
  }
};

// On load, check login
window.addEventListener('DOMContentLoaded', function () {
  if (localStorage.getItem('codeAssistantLoggedIn') === '1') {
    loggedIn = true;
    hideLogin();
  } else {
    showLogin();
  }
});

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new CodeAssistant();
  } catch (error) {
    document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h3>❌ Extension Error</h3>
                <p>Failed to initialize the extension. Please refresh and try again.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
  }
});
