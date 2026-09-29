/**
 * OmniArticle - Universal Article Reader & Multi-Language Translator
 * Client Application Logic
 * Typography: Space Grotesk | Fully Responsive Mobile, Tablet & Desktop
 */

// Application State
const state = {
  currentArticle: null,
  targetLang: localStorage.getItem('omni_target_lang') || 'hi',
  targetLangName: 'Hindi',
  theme: localStorage.getItem('omni_theme') || 'light',
  fontFamily: localStorage.getItem('omni_font') || 'space',
  fontSize: parseInt(localStorage.getItem('omni_font_size')) || 18,
  lineHeight: localStorage.getItem('omni_line_height') || 'normal',
  isDualView: false,
  translatedParagraphs: new Map(), // pIndex -> translatedText
  vocabulary: JSON.parse(localStorage.getItem('omni_vocab') || '[]'),
  activeSelection: '',
  activeWordData: null,
  currentFlashcardIndex: 0,
  flashcardFlipped: false,
  isTranslatingAll: false,
  isMobileSidebarOpen: false
};

// DOM Elements
const elements = {
  // Navigation & URL
  urlInput: document.getElementById('urlInput'),
  fetchBtn: document.getElementById('fetchBtn'),
  clearUrlBtn: document.getElementById('clearUrlBtn'),
  pasteUrlBtn: document.getElementById('pasteUrlBtn'),
  targetLangSelect: document.getElementById('targetLangSelect'),
  sidebarLangSelect: document.getElementById('sidebarLangSelect'),
  settingsLangSelect: document.getElementById('settingsLangSelect'),
  sampleArticlesBtn: document.getElementById('sampleArticlesBtn'),
  sampleDropdown: document.getElementById('sampleDropdown'),
  customArticleBtn: document.getElementById('customArticleBtn'),
  dualViewBtn: document.getElementById('dualViewBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsDropdown: document.getElementById('settingsDropdown'),
  vocabDrawerBtn: document.getElementById('vocabDrawerBtn'),
  vocabBadgeCount: document.getElementById('vocabBadgeCount'),
  readingProgressBar: document.getElementById('readingProgressBar'),

  // Mobile Controls
  mobileSidebarToggleBtn: document.getElementById('mobileSidebarToggleBtn'),
  closeMobileSidebarBtn: document.getElementById('closeMobileSidebarBtn'),
  mobileSidebarBadge: document.getElementById('mobileSidebarBadge'),
  mobTabReader: document.getElementById('mobTabReader'),
  mobTabTranslate: document.getElementById('mobTabTranslate'),
  mobTranslateBadge: document.getElementById('mobTranslateBadge'),
  mobVocabBadge: document.getElementById('mobVocabBadge'),

  // Reader States
  readerSection: document.getElementById('readerSection'),
  welcomeState: document.getElementById('welcomeState'),
  loadingState: document.getElementById('loadingState'),
  loadingText: document.getElementById('loadingText'),
  errorState: document.getElementById('errorState'),
  errorHeading: document.getElementById('errorHeading'),
  errorMessage: document.getElementById('errorMessage'),
  articleCard: document.getElementById('articleCard'),

  // Article Content
  articleSiteBadge: document.getElementById('articleSiteBadge'),
  articleSiteName: document.getElementById('articleSiteName'),
  articleReadTime: document.getElementById('articleReadTime'),
  articleWordCount: document.getElementById('articleWordCount'),
  articleTitle: document.getElementById('articleTitle'),
  articleAuthor: document.getElementById('articleAuthor'),
  articlePublishedDate: document.getElementById('articlePublishedDate'),
  articleHeroFigure: document.getElementById('articleHeroFigure'),
  articleHeroImage: document.getElementById('articleHeroImage'),
  articleBody: document.getElementById('articleBody'),
  originalLinkBtn: document.getElementById('originalLinkBtn'),
  translateAllBtn: document.getElementById('translateAllBtn'),
  speakArticleBtn: document.getElementById('speakArticleBtn'),
  printArticleBtn: document.getElementById('printArticleBtn'),
  translationProgressBanner: document.getElementById('translationProgressBanner'),
  progressLangName: document.getElementById('progressLangName'),
  progressPercentage: document.getElementById('progressPercentage'),
  progressBarFill: document.getElementById('progressBarFill'),

  // Sidebar Elements
  sidebarSection: document.getElementById('sidebarSection'),
  activeLangFlag: document.getElementById('activeLangFlag'),
  activeLangName: document.getElementById('activeLangName'),
  selectedTextDisplay: document.getElementById('selectedTextDisplay'),
  speakSelectedBtn: document.getElementById('speakSelectedBtn'),
  saveWordBtn: document.getElementById('saveWordBtn'),
  translationTargetTitle: document.getElementById('translationTargetTitle'),
  translationDisplay: document.getElementById('translationDisplay'),
  speakTranslationBtn: document.getElementById('speakTranslationBtn'),
  copyTranslationBtn: document.getElementById('copyTranslationBtn'),
  dictionaryCard: document.getElementById('dictionaryCard'),
  phoneticTag: document.getElementById('phoneticTag'),
  definitionsContainer: document.getElementById('definitionsContainer'),
  synonymsWrapper: document.getElementById('synonymsWrapper'),
  synonymsContainer: document.getElementById('synonymsContainer'),
  antonymsWrapper: document.getElementById('antonymsWrapper'),
  antonymsContainer: document.getElementById('antonymsContainer'),

  // Floating Tooltip
  floatingTooltip: document.getElementById('floatingTooltip'),
  floatTranslateBtn: document.getElementById('floatTranslateBtn'),
  floatSpeakBtn: document.getElementById('floatSpeakBtn'),
  floatSaveBtn: document.getElementById('floatSaveBtn'),

  // Modals & Drawers
  customModal: document.getElementById('customModal'),
  customTitle: document.getElementById('customTitle'),
  customAuthor: document.getElementById('customAuthor'),
  customSource: document.getElementById('customSource'),
  customContent: document.getElementById('customContent'),
  vocabDrawer: document.getElementById('vocabDrawer'),
  drawerVocabCount: document.getElementById('drawerVocabCount'),
  vocabSearchInput: document.getElementById('vocabSearchInput'),
  vocabListContainer: document.getElementById('vocabListContainer'),
  studyModeBtn: document.getElementById('studyModeBtn'),
  exportVocabBtn: document.getElementById('exportVocabBtn'),
  clearVocabBtn: document.getElementById('clearVocabBtn'),

  // Flashcards
  flashcardSection: document.getElementById('flashcardSection'),
  flashcardCard: document.getElementById('flashcardCard'),
  flashcardCounter: document.getElementById('flashcardCounter'),
  fcWord: document.getElementById('fcWord'),
  fcPhonetic: document.getElementById('fcPhonetic'),
  fcTranslation: document.getElementById('fcTranslation'),
  fcDefinition: document.getElementById('fcDefinition'),

  // Toast Container
  toastContainer: document.getElementById('toastContainer')
};

// Cached Language List
let languagesList = [];

// Initialize Application
async function initApp() {
  applyTheme(state.theme);
  applyTypography(state.fontFamily, state.fontSize, state.lineHeight);
  updateVocabBadge();

  await loadLanguages();
  setupEventListeners();

  // Check URL parameter (?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const initialUrl = urlParams.get('url');
  if (initialUrl) {
    elements.urlInput.value = initialUrl;
    elements.clearUrlBtn.style.display = 'inline-flex';
    fetchArticle(initialUrl);
  }
}

// Load Languages from Backend
async function loadLanguages() {
  try {
    const res = await fetch('/api/languages');
    const data = await res.json();
    languagesList = data.languages || [];

    const optionsHtml = languagesList.map(lang => 
      `<option value="${lang.code}" ${lang.code === state.targetLang ? 'selected' : ''}>
        ${lang.flag || '🌐'} ${lang.name} (${lang.native})
      </option>`
    ).join('');

    if (elements.targetLangSelect) elements.targetLangSelect.innerHTML = optionsHtml;
    if (elements.sidebarLangSelect) elements.sidebarLangSelect.innerHTML = optionsHtml;
    if (elements.settingsLangSelect) elements.settingsLangSelect.innerHTML = optionsHtml;

    updateActiveLanguageDisplay();
  } catch (err) {
    console.error('Failed to load languages list:', err);
  }
}

// Update Active Language Text & Flag in UI
function updateActiveLanguageDisplay() {
  const current = languagesList.find(l => l.code === state.targetLang);
  if (current) {
    state.targetLangName = current.name;
    if (elements.activeLangFlag) elements.activeLangFlag.textContent = current.flag || '🌐';
    if (elements.activeLangName) elements.activeLangName.textContent = current.name;
    if (elements.translationTargetTitle) elements.translationTargetTitle.textContent = `${current.name} Translation`;
  }

  // Keep all language dropdowns synchronized
  if (elements.targetLangSelect) elements.targetLangSelect.value = state.targetLang;
  if (elements.sidebarLangSelect) elements.sidebarLangSelect.value = state.targetLang;
  if (elements.settingsLangSelect) elements.settingsLangSelect.value = state.targetLang;
}

// Setup Event Listeners
function setupEventListeners() {
  // URL Input Bar
  elements.fetchBtn.addEventListener('click', () => {
    const url = elements.urlInput.value.trim();
    if (url) fetchArticle(url);
  });

  elements.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const url = elements.urlInput.value.trim();
      if (url) fetchArticle(url);
    }
  });

  elements.urlInput.addEventListener('input', () => {
    elements.clearUrlBtn.style.display = elements.urlInput.value ? 'inline-flex' : 'none';
  });

  elements.clearUrlBtn.addEventListener('click', () => {
    elements.urlInput.value = '';
    elements.clearUrlBtn.style.display = 'none';
    elements.urlInput.focus();
  });

  elements.pasteUrlBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        elements.urlInput.value = text.trim();
        elements.clearUrlBtn.style.display = 'inline-flex';
        fetchArticle(text.trim());
      }
    } catch (e) {
      elements.urlInput.focus();
    }
  });

  // Target Language Change Helper
  function handleLanguageChange(newLang) {
    if (!newLang || newLang === state.targetLang) return;
    state.targetLang = newLang;
    localStorage.setItem('omni_target_lang', state.targetLang);
    updateActiveLanguageDisplay();

    // Re-translate current selection if present
    if (state.activeSelection) {
      translateSelectedText(state.activeSelection);
    }

    // If dual view active or paragraphs were translated, re-translate
    if (state.currentArticle && (state.isDualView || state.translatedParagraphs.size > 0)) {
      translateAllParagraphs();
    }
  }

  // Attach change listeners to all language selects (header, sidebar, settings)
  if (elements.targetLangSelect) {
    elements.targetLangSelect.addEventListener('change', (e) => handleLanguageChange(e.target.value));
  }
  if (elements.sidebarLangSelect) {
    elements.sidebarLangSelect.addEventListener('change', (e) => handleLanguageChange(e.target.value));
  }
  if (elements.settingsLangSelect) {
    elements.settingsLangSelect.addEventListener('change', (e) => handleLanguageChange(e.target.value));
  }

  // Mobile Sidebar Toggle
  if (elements.mobileSidebarToggleBtn) {
    elements.mobileSidebarToggleBtn.addEventListener('click', toggleMobileSidebar);
  }
  if (elements.closeMobileSidebarBtn) {
    elements.closeMobileSidebarBtn.addEventListener('click', () => setMobileSidebar(false));
  }

  // Dropdown toggles
  if (elements.sampleArticlesBtn) {
    elements.sampleArticlesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.sampleDropdown.classList.toggle('show');
      elements.settingsDropdown.classList.remove('show');
    });
  }

  elements.settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.settingsDropdown.classList.toggle('show');
    if (elements.sampleDropdown) elements.sampleDropdown.classList.remove('show');
  });

  document.addEventListener('click', (e) => {
    if (elements.sampleDropdown && !elements.sampleDropdown.contains(e.target) && e.target !== elements.sampleArticlesBtn) {
      elements.sampleDropdown.classList.remove('show');
    }
    if (!elements.settingsDropdown.contains(e.target) && !elements.settingsBtn.contains(e.target)) {
      elements.settingsDropdown.classList.remove('show');
    }
  });

  // Reading Preferences
  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTheme(btn.dataset.theme);
    });
  });

  document.querySelectorAll('.font-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.font-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTypography(btn.dataset.font, state.fontSize, state.lineHeight);
    });
  });

  document.querySelectorAll('.spacing-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.spacing-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyTypography(state.fontFamily, state.fontSize, btn.dataset.spacing);
    });
  });

  document.getElementById('increaseFontBtn').addEventListener('click', () => {
    if (state.fontSize < 28) {
      state.fontSize += 2;
      applyTypography(state.fontFamily, state.fontSize, state.lineHeight);
    }
  });

  document.getElementById('decreaseFontBtn').addEventListener('click', () => {
    if (state.fontSize > 14) {
      state.fontSize -= 2;
      applyTypography(state.fontFamily, state.fontSize, state.lineHeight);
    }
  });

  // Dual View Toggle
  if (elements.dualViewBtn) {
    elements.dualViewBtn.addEventListener('click', toggleDualView);
  }

  // Custom Article Modal
  if (elements.customArticleBtn) {
    elements.customArticleBtn.addEventListener('click', openCustomArticleModal);
  }

  // Vocab Drawer
  if (elements.vocabDrawerBtn) {
    elements.vocabDrawerBtn.addEventListener('click', openVocabDrawer);
  }

  elements.vocabSearchInput.addEventListener('input', () => {
    renderVocabList(elements.vocabSearchInput.value.trim().toLowerCase());
  });

  elements.exportVocabBtn.addEventListener('click', exportVocabulary);
  elements.clearVocabBtn.addEventListener('click', clearAllVocabulary);
  elements.studyModeBtn.addEventListener('click', () => toggleFlashcardMode(true));

  // Article Action Buttons
  elements.translateAllBtn.addEventListener('click', translateAllParagraphs);
  elements.speakArticleBtn.addEventListener('click', toggleSpeakArticle);
  elements.printArticleBtn.addEventListener('click', () => window.print());

  // Sidebar Action Buttons
  elements.speakSelectedBtn.addEventListener('click', () => speakText(state.activeSelection, 'auto'));
  elements.speakTranslationBtn.addEventListener('click', () => speakText(elements.translationDisplay.innerText, state.targetLang));
  elements.copyTranslationBtn.addEventListener('click', copyTranslation);
  elements.saveWordBtn.addEventListener('click', saveActiveWord);

  // Floating Tooltip buttons (Touch & Click Support)
  const onTranslateClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (state.activeSelection) {
      translateSelectedText(state.activeSelection);
      if (window.innerWidth <= 768) setMobileSidebar(true);
    }
    hideFloatingTooltip();
  };
  elements.floatTranslateBtn.addEventListener('click', onTranslateClick);
  elements.floatTranslateBtn.addEventListener('touchend', onTranslateClick);

  const onSpeakClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (state.activeSelection) speakText(state.activeSelection, 'auto');
    hideFloatingTooltip();
  };
  elements.floatSpeakBtn.addEventListener('click', onSpeakClick);
  elements.floatSpeakBtn.addEventListener('touchend', onSpeakClick);

  const onSaveClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    saveActiveWord();
    hideFloatingTooltip();
  };
  elements.floatSaveBtn.addEventListener('click', onSaveClick);
  elements.floatSaveBtn.addEventListener('touchend', onSaveClick);

  // Text Selection Listeners (Mobile & Desktop)
  let selectionDebounce;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(handleTextSelection, 150);
  });

  // Mobile Touch & Mouse Release Listeners
  elements.readerSection.addEventListener('touchend', () => {
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(handleTextSelection, 120);
  });
  elements.readerSection.addEventListener('mouseup', () => {
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(handleTextSelection, 80);
  });

  // Tap-to-Inspect a Word on Touch/Click in Article
  elements.readerSection.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.block-actions') || e.target.closest('.floating-tooltip')) {
      return;
    }

    const currentSel = window.getSelection();
    if (currentSel && currentSel.toString().trim().length > 0) {
      return; // Already selected, handleTextSelection processes it
    }

    // Attempt to detect word under tap
    const wordInfo = getWordAtPoint(e.clientX, e.clientY);
    if (wordInfo && wordInfo.word) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(wordInfo.range);
      handleTextSelection();
    } else {
      hideFloatingTooltip();
    }
  });

  // Dismiss floating tooltip on click/tap outside
  document.addEventListener('pointerdown', (e) => {
    if (!elements.floatingTooltip.contains(e.target) && !e.target.closest('.article-p')) {
      hideFloatingTooltip();
    }
  });

  // Reading Progress Bar
  elements.readerSection.addEventListener('scroll', updateReadingProgress);

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCustomArticleModal();
      closeVocabDrawer();
      setMobileSidebar(false);
      hideFloatingTooltip();
    }
  });
}

// Mobile Tab & Sidebar Management
function toggleMobileSidebar() {
  setMobileSidebar(!state.isMobileSidebarOpen);
}

function setMobileSidebar(isOpen) {
  state.isMobileSidebarOpen = isOpen;
  elements.sidebarSection.classList.toggle('mobile-open', isOpen);
  if (isOpen) {
    if (elements.mobTranslateBadge) elements.mobTranslateBadge.style.display = 'none';
    if (elements.mobileSidebarBadge) elements.mobileSidebarBadge.style.display = 'none';
    if (elements.mobTabTranslate) elements.mobTabTranslate.classList.add('active');
    if (elements.mobTabReader) elements.mobTabReader.classList.remove('active');
  } else {
    if (elements.mobTabTranslate) elements.mobTabTranslate.classList.remove('active');
    if (elements.mobTabReader) elements.mobTabReader.classList.add('active');
  }
}

window.switchToMobileTab = function(tab) {
  if (tab === 'reader') {
    setMobileSidebar(false);
  } else if (tab === 'translate') {
    setMobileSidebar(true);
  }
};

window.toggleMobileSettings = function() {
  elements.settingsDropdown.classList.toggle('show');
};

// Reading Progress Calculation
function updateReadingProgress() {
  const el = elements.readerSection;
  const scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight - el.clientHeight;
  const progress = scrollHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollHeight) * 100)) : 0;
  elements.readingProgressBar.style.width = `${progress}%`;
}

// Theme Application
function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('omni_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

// Typography Application
function applyTypography(family, size, spacing) {
  state.fontFamily = family;
  state.fontSize = size;
  state.lineHeight = spacing;

  localStorage.setItem('omni_font', family);
  localStorage.setItem('omni_font_size', size);
  localStorage.setItem('omni_line_height', spacing);

  const fontMap = {
    space: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    sans: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "'Merriweather', Georgia, Cambria, 'Times New Roman', serif",
    dyslexic: "'Comic Sans MS', 'Arial Rounded MT Bold', sans-serif"
  };

  const selectedFont = fontMap[family] || fontMap.space;
  document.documentElement.style.setProperty('--reader-font-family', selectedFont);

  const lhValues = { compact: '1.5', normal: '1.85', relaxed: '2.2' };
  document.documentElement.style.setProperty('--reader-font-size', `${size}px`);
  document.documentElement.style.setProperty('--reader-line-height', lhValues[spacing] || '1.85');

  // Update body font classes without wiping existing classes like dual-view-active
  document.body.classList.remove('font-space', 'font-sans', 'font-serif', 'font-dyslexic');
  document.body.classList.add(`font-${family}`);

  const displayEl = document.getElementById('fontSizeDisplay');
  if (displayEl) displayEl.textContent = `${size}px`;

  // Update active state on font and spacing buttons
  document.querySelectorAll('.font-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === family);
  });
  document.querySelectorAll('.spacing-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.spacing === spacing);
  });
}

// Article Fetching
async function fetchArticle(url) {
  if (!url) return;

  showState('loading');
  try {
    elements.loadingText.textContent = `Connecting to ${new URL(url).hostname}...`;
  } catch (e) {
    elements.loadingText.textContent = 'Connecting to website...';
  }
  elements.fetchBtn.disabled = true;

  try {
    const res = await fetch('/api/fetch-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch article');
    }

    renderArticle(data);
    showToast('Article loaded successfully!', 'success');
  } catch (err) {
    console.error('Fetch error:', err);
    elements.errorHeading.textContent = 'Could Not Extract Article';
    elements.errorMessage.textContent = err.message || 'Please check the link and try again.';
    showState('error');
  } finally {
    elements.fetchBtn.disabled = false;
  }
}

// Load Curated Sample Article
async function loadSampleArticle(id) {
  if (elements.sampleDropdown) elements.sampleDropdown.classList.remove('show');
  showState('loading');
  elements.loadingText.textContent = 'Loading sample article...';

  try {
    const res = await fetch(`/api/samples/${id}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || 'Sample not found');

    const totalWords = data.content
      .filter(b => b.type === 'paragraph')
      .reduce((acc, b) => acc + b.text.split(/\s+/).length, 0);

    data.wordCount = totalWords;
    data.readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));
    data.blocks = data.content;

    elements.urlInput.value = `Sample: ${data.title}`;
    renderArticle(data);
  } catch (err) {
    console.error('Sample error:', err);
    showToast(err.message, 'error');
    showState('welcome');
  }
}

// Render Article into Reader
function renderArticle(articleData) {
  state.currentArticle = articleData;
  state.translatedParagraphs.clear();
  elements.translationProgressBanner.style.display = 'none';

  // Metadata
  elements.articleSiteName.textContent = articleData.siteName || 'Web Article';
  elements.articleReadTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${articleData.readingTimeMinutes || 3} min read`;
  elements.articleWordCount.innerHTML = `<i class="fa-solid fa-align-left"></i> ${articleData.wordCount || 0} words`;
  elements.articleTitle.textContent = articleData.title;
  elements.articleAuthor.textContent = articleData.author || 'Staff Writer';
  elements.articlePublishedDate.textContent = articleData.publishedTime ? new Date(articleData.publishedTime).toLocaleDateString() : '';

  if (articleData.url && articleData.url.startsWith('http')) {
    elements.originalLinkBtn.href = articleData.url;
    elements.originalLinkBtn.style.display = 'inline-flex';
  } else {
    elements.originalLinkBtn.style.display = 'none';
  }

  // Hero Image
  if (articleData.leadImage) {
    elements.articleHeroImage.src = articleData.leadImage;
    elements.articleHeroFigure.style.display = 'block';
  } else {
    elements.articleHeroFigure.style.display = 'none';
  }

  // Render Body Blocks
  renderArticleBlocks(articleData.blocks);

  showState('article');
  elements.readerSection.scrollTop = 0;
  updateReadingProgress();
}

// Render structured blocks
function renderArticleBlocks(blocks) {
  if (state.isDualView) {
    renderDualViewContent(blocks);
    return;
  }

  let html = '';
  blocks.forEach((block) => {
    if (block.type === 'paragraph') {
      const translated = state.translatedParagraphs.get(block.id);
      html += `
        <div class="article-block-wrapper" id="block-${block.id}" data-id="${block.id}">
          <p class="article-p" id="${block.id}">${escapeHtml(block.text)}</p>
          <div class="block-actions">
            <button class="block-action-btn" onclick="translateSingleParagraph('${block.id}')" title="Translate paragraph">
              <i class="fa-solid fa-language"></i> Translate
            </button>
            <button class="block-action-btn" onclick="speakParagraph('${block.id}')" title="Read aloud">
              <i class="fa-solid fa-volume-high"></i>
            </button>
            <button class="block-action-btn" onclick="copyParagraph('${block.id}')" title="Copy">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>
          ${translated ? `
            <div class="inline-translated-box" id="trans-${block.id}">
              <div class="inline-translated-label">
                <span>${state.targetLangName}</span>
                <button class="icon-btn" onclick="speakText('${escapeAttr(translated)}', '${state.targetLang}')" title="Listen"><i class="fa-solid fa-volume-high"></i></button>
              </div>
              <p>${escapeHtml(translated)}</p>
            </div>
          ` : ''}
        </div>
      `;
    } else if (block.type === 'heading') {
      html += `<h${block.level || 2} class="article-h${block.level || 2}">${escapeHtml(block.text)}</h${block.level || 2}>`;
    } else if (block.type === 'quote') {
      html += `<blockquote class="article-quote">${escapeHtml(block.text)}</blockquote>`;
    }
  });

  elements.articleBody.innerHTML = html;
}

// Render Dual View (Bilingual Side-by-Side)
function renderDualViewContent(blocks) {
  let leftHtml = '<div class="dual-col-left"><div class="dual-col-header">Original Text</div>';
  let rightHtml = `<div class="dual-col-right"><div class="dual-col-header">${state.targetLangName} Translation</div>`;

  blocks.forEach(block => {
    if (block.type === 'paragraph') {
      const translated = state.translatedParagraphs.get(block.id) || '<em>Translating...</em>';
      leftHtml += `
        <div class="dual-paragraph-match" id="dual-left-${block.id}" onmouseenter="highlightDualPair('${block.id}', true)" onmouseleave="highlightDualPair('${block.id}', false)">
          <p class="article-p" id="${block.id}">${escapeHtml(block.text)}</p>
        </div>
      `;
      rightHtml += `
        <div class="dual-paragraph-match" id="dual-right-${block.id}" onmouseenter="highlightDualPair('${block.id}', true)" onmouseleave="highlightDualPair('${block.id}', false)">
          <p class="article-p">${escapeHtml(translated)}</p>
        </div>
      `;
    } else if (block.type === 'heading') {
      leftHtml += `<h${block.level || 2} class="article-h${block.level || 2}">${escapeHtml(block.text)}</h${block.level || 2}>`;
      rightHtml += `<h${block.level || 2} class="article-h${block.level || 2}">${escapeHtml(block.text)}</h${block.level || 2}>`;
    } else if (block.type === 'quote') {
      leftHtml += `<blockquote class="article-quote">${escapeHtml(block.text)}</blockquote>`;
      rightHtml += `<blockquote class="article-quote">${escapeHtml(block.text)}</blockquote>`;
    }
  });

  leftHtml += '</div>';
  rightHtml += '</div>';

  elements.articleBody.innerHTML = `<div class="dual-container">${leftHtml}${rightHtml}</div>`;
}

// Highlight Dual Pair on hover
window.highlightDualPair = function(id, isHighlight) {
  const left = document.getElementById(`dual-left-${id}`);
  const right = document.getElementById(`dual-right-${id}`);
  if (left && right) {
    left.classList.toggle('highlighted', isHighlight);
    right.classList.toggle('highlighted', isHighlight);
  }
};

// Toggle Dual View Mode
function toggleDualView() {
  state.isDualView = !state.isDualView;
  if (elements.dualViewBtn) elements.dualViewBtn.classList.toggle('active', state.isDualView);
  document.body.classList.toggle('dual-view-active', state.isDualView);

  if (state.currentArticle) {
    if (state.isDualView && state.translatedParagraphs.size === 0) {
      translateAllParagraphs();
    } else {
      renderArticleBlocks(state.currentArticle.blocks);
    }
  }
}

// Translate Single Paragraph
window.translateSingleParagraph = async function(paragraphId) {
  const block = state.currentArticle?.blocks.find(b => b.id === paragraphId);
  if (!block) return;

  const wrapper = document.getElementById(`block-${paragraphId}`);
  if (!wrapper) return;

  const existingBox = document.getElementById(`trans-${paragraphId}`);
  if (existingBox) {
    existingBox.remove();
    return;
  }

  const box = document.createElement('div');
  box.className = 'inline-translated-box';
  box.id = `trans-${paragraphId}`;
  box.innerHTML = `<span class="placeholder-muted"><i class="fa-solid fa-spinner fa-spin"></i> Translating into ${state.targetLangName}...</span>`;
  wrapper.appendChild(box);

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: block.text, targetLang: state.targetLang })
    });
    const data = await res.json();
    if (data.translation) {
      state.translatedParagraphs.set(paragraphId, data.translation);
      box.innerHTML = `
        <div class="inline-translated-label">
          <span>${state.targetLangName}</span>
          <button class="icon-btn" onclick="speakText('${escapeAttr(data.translation)}', '${state.targetLang}')" title="Listen"><i class="fa-solid fa-volume-high"></i></button>
        </div>
        <p>${escapeHtml(data.translation)}</p>
      `;
    } else {
      box.innerHTML = '<span class="placeholder-muted">Translation failed.</span>';
    }
  } catch (err) {
    box.innerHTML = '<span class="placeholder-muted">Error reaching translation service.</span>';
  }
};

// Translate All Paragraphs in Article
async function translateAllParagraphs() {
  if (!state.currentArticle || state.isTranslatingAll) return;

  const paragraphs = state.currentArticle.blocks.filter(b => b.type === 'paragraph');
  if (paragraphs.length === 0) return;

  state.isTranslatingAll = true;
  elements.translateAllBtn.disabled = true;
  elements.translationProgressBanner.style.display = 'block';
  elements.progressLangName.textContent = state.targetLangName;

  const textsToTranslate = paragraphs.map(p => p.text);

  try {
    elements.progressBarFill.style.width = '20%';
    elements.progressPercentage.textContent = '20%';

    const res = await fetch('/api/translate-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: textsToTranslate,
        targetLang: state.targetLang
      })
    });

    const data = await res.json();
    if (data.translations && Array.isArray(data.translations)) {
      paragraphs.forEach((p, idx) => {
        if (data.translations[idx]) {
          state.translatedParagraphs.set(p.id, data.translations[idx]);
        }
      });

      elements.progressBarFill.style.width = '100%';
      elements.progressPercentage.textContent = '100%';
      setTimeout(() => {
        elements.translationProgressBanner.style.display = 'none';
      }, 1500);

      renderArticleBlocks(state.currentArticle.blocks);
      showToast(`Article successfully translated into ${state.targetLangName}!`, 'success');
    }
  } catch (err) {
    console.error('Batch translation failed:', err);
    showToast('Failed to translate full article. Please try again.', 'error');
  } finally {
    state.isTranslatingAll = false;
    elements.translateAllBtn.disabled = false;
  }
}

// Handle Text Selection in Article (Touch & Mouse Support)
function handleTextSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const selectedText = selection.toString().trim();
  if (!selectedText) {
    return;
  }

  const anchorNode = selection.anchorNode;
  if (!anchorNode || !elements.readerSection.contains(anchorNode)) {
    return;
  }

  state.activeSelection = selectedText;

  // Show floating tooltip near selection using viewport-relative bounding rect
  try {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect && (rect.width > 0 || rect.height > 0)) {
      showFloatingTooltip(rect);
    }
  } catch (e) {
    // Range error safeguard
  }

  // Update Sidebar
  elements.selectedTextDisplay.innerHTML = `<p>${escapeHtml(selectedText)}</p>`;
  elements.speakSelectedBtn.style.display = 'inline-flex';

  // Mobile badges alert
  if (elements.mobTranslateBadge) elements.mobTranslateBadge.style.display = 'block';
  if (elements.mobileSidebarBadge) elements.mobileSidebarBadge.style.display = 'block';

  // Translate
  translateSelectedText(selectedText);

  // Check if single word for dictionary lookup
  const isSingleWord = !selectedText.includes(' ') && selectedText.length >= 2 && /^[a-zA-Z]+$/.test(selectedText);
  if (isSingleWord) {
    elements.saveWordBtn.style.display = 'inline-flex';
    fetchWordDictionary(selectedText);
  } else {
    elements.saveWordBtn.style.display = 'none';
    elements.dictionaryCard.style.display = 'none';
  }
}

// Show Floating Quick Tooltip (Fixed Viewport Position for Mobile & Desktop)
function showFloatingTooltip(rect) {
  if (!rect || (rect.width === 0 && rect.height === 0)) return;

  const tooltip = elements.floatingTooltip;
  tooltip.style.display = 'flex';

  const tooltipWidth = tooltip.offsetWidth || 230;
  const tooltipHeight = tooltip.offsetHeight || 42;

  // Compute fixed position relative to viewport
  let top = rect.top - tooltipHeight - 12;
  let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);

  // If too close to top of screen or header, flip below selection
  if (top < 65) {
    top = rect.bottom + 12;
  }

  // Prevent horizontal overflow off mobile screen
  const maxLeft = window.innerWidth - tooltipWidth - 12;
  left = Math.max(12, Math.min(left, maxLeft));

  tooltip.style.top = `${Math.round(top)}px`;
  tooltip.style.left = `${Math.round(left)}px`;
}

function hideFloatingTooltip() {
  elements.floatingTooltip.style.display = 'none';
}

// Helper: Extract Word and Range from Touch/Click Coordinates
function getWordAtPoint(x, y) {
  let range;
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(x, y);
  } else if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      range = document.createRange();
      range.setStart(pos.offsetNode, pos.offset);
      range.collapse(true);
    }
  }

  if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) {
    return null;
  }

  const textNode = range.startContainer;
  const fullText = textNode.textContent;
  let offset = range.startOffset;

  if (offset >= fullText.length) offset = fullText.length - 1;
  if (offset < 0 || !/[a-zA-Z\u00C0-\u024F\u0900-\u097F]/.test(fullText[offset])) {
    if (offset > 0 && /[a-zA-Z\u00C0-\u024F\u0900-\u097F]/.test(fullText[offset - 1])) {
      offset--;
    } else {
      return null;
    }
  }

  // Find start boundary
  let start = offset;
  while (start > 0 && /[a-zA-Z\u00C0-\u024F\u0900-\u097F]/.test(fullText[start - 1])) {
    start--;
  }

  // Find end boundary
  let end = offset;
  while (end < fullText.length && /[a-zA-Z\u00C0-\u024F\u0900-\u097F]/.test(fullText[end])) {
    end++;
  }

  if (end > start) {
    const word = fullText.slice(start, end).trim();
    if (word.length >= 2) {
      const wordRange = document.createRange();
      wordRange.setStart(textNode, start);
      wordRange.setEnd(textNode, end);
      return { word, range: wordRange };
    }
  }
  return null;
}

// Translate Selected Text via Backend
async function translateSelectedText(text) {
  elements.translationDisplay.innerHTML = '<span class="placeholder-muted"><i class="fa-solid fa-spinner fa-spin"></i> Translating...</span>';
  elements.speakTranslationBtn.style.display = 'none';
  elements.copyTranslationBtn.style.display = 'none';

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: state.targetLang })
    });
    const data = await res.json();

    if (data.translation) {
      elements.translationDisplay.innerHTML = `<p>${escapeHtml(data.translation)}</p>`;
      elements.speakTranslationBtn.style.display = 'inline-flex';
      elements.copyTranslationBtn.style.display = 'inline-flex';

      if (state.activeWordData) {
        state.activeWordData.translation = data.translation;
      }
    } else {
      elements.translationDisplay.innerHTML = '<span class="placeholder-muted">Translation failed.</span>';
    }
  } catch (err) {
    elements.translationDisplay.innerHTML = '<span class="placeholder-muted">Translation service error.</span>';
  }
}

// Fetch Dictionary & Synonyms for Single Word
async function fetchWordDictionary(word) {
  elements.dictionaryCard.style.display = 'block';
  elements.phoneticTag.textContent = '';
  elements.definitionsContainer.innerHTML = '<span class="placeholder-muted"><i class="fa-solid fa-spinner fa-spin"></i> Finding definitions & synonyms...</span>';
  elements.synonymsWrapper.style.display = 'none';
  elements.antonymsWrapper.style.display = 'none';

  try {
    const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
    const data = await res.json();
    state.activeWordData = { word, ...data };

    if (data.phonetic) {
      elements.phoneticTag.textContent = data.phonetic;
    }

    if (data.meanings && data.meanings.length > 0) {
      elements.definitionsContainer.innerHTML = data.meanings.map(m => `
        <div class="def-item">
          <span class="def-pos">${escapeHtml(m.partOfSpeech)}</span>
          <span>${escapeHtml(m.definition)}</span>
          ${m.example ? `<span class="def-example">"${escapeHtml(m.example)}"</span>` : ''}
        </div>
      `).join('');
    } else {
      elements.definitionsContainer.innerHTML = '<span class="placeholder-muted">No dictionary definitions found.</span>';
    }

    // Synonyms
    if (data.synonyms && data.synonyms.length > 0) {
      elements.synonymsWrapper.style.display = 'block';
      elements.synonymsContainer.innerHTML = data.synonyms.map(syn => `
        <button class="synonym-chip" onclick="lookupWord('${escapeAttr(syn)}')">${escapeHtml(syn)}</button>
      `).join('');
    }

    // Antonyms
    if (data.antonyms && data.antonyms.length > 0) {
      elements.antonymsWrapper.style.display = 'block';
      elements.antonymsContainer.innerHTML = data.antonyms.map(ant => `
        <button class="antonym-chip" onclick="lookupWord('${escapeAttr(ant)}')">${escapeHtml(ant)}</button>
      `).join('');
    }

  } catch (err) {
    elements.definitionsContainer.innerHTML = '<span class="placeholder-muted">Could not retrieve dictionary information.</span>';
  }
}

// Lookup a specific word
window.lookupWord = function(word) {
  state.activeSelection = word;
  elements.selectedTextDisplay.innerHTML = `<p>${escapeHtml(word)}</p>`;
  elements.speakSelectedBtn.style.display = 'inline-flex';
  elements.saveWordBtn.style.display = 'inline-flex';
  translateSelectedText(word);
  fetchWordDictionary(word);
};

// Copy Translation to Clipboard
function copyTranslation() {
  const text = elements.translationDisplay.innerText;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Translation copied to clipboard!', 'success');
  });
}

// Text-to-Speech Engine
function speakText(text, langCode = 'auto') {
  if (!text || !('speechSynthesis' in window)) {
    showToast('Text-to-speech is not supported on this browser.', 'error');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);

  if (langCode && langCode !== 'auto') {
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode));
    if (matchingVoice) utterance.voice = matchingVoice;
    utterance.lang = langCode;
  }

  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

// Speak paragraph
window.speakParagraph = function(id) {
  const block = state.currentArticle?.blocks.find(b => b.id === id);
  if (block) speakText(block.text, 'en');
};

// Copy paragraph
window.copyParagraph = function(id) {
  const block = state.currentArticle?.blocks.find(b => b.id === id);
  if (block) {
    navigator.clipboard.writeText(block.text).then(() => {
      showToast('Paragraph copied to clipboard!', 'success');
    });
  }
};

// Speak whole article
let isSpeakingArticle = false;

function toggleSpeakArticle() {
  const waves = elements.speakArticleBtn.querySelector('.audio-waves');
  const label = elements.speakArticleBtn.querySelector('.btn-speech-label');

  if (isSpeakingArticle) {
    window.speechSynthesis.cancel();
    isSpeakingArticle = false;
    if (label) label.textContent = 'Listen';
    if (waves) waves.style.display = 'none';
    elements.speakArticleBtn.querySelector('i').className = 'fa-solid fa-volume-high';
    return;
  }

  if (!state.currentArticle) return;
  const paragraphs = state.currentArticle.blocks.filter(b => b.type === 'paragraph');
  if (paragraphs.length === 0) return;

  isSpeakingArticle = true;
  if (label) label.textContent = 'Pause';
  if (waves) waves.style.display = 'inline-flex';
  elements.speakArticleBtn.querySelector('i').className = 'fa-solid fa-pause';
  speakParagraphSequence(paragraphs, 0);
}

function speakParagraphSequence(paragraphs, index) {
  const waves = elements.speakArticleBtn.querySelector('.audio-waves');
  const label = elements.speakArticleBtn.querySelector('.btn-speech-label');

  if (!isSpeakingArticle || index >= paragraphs.length) {
    isSpeakingArticle = false;
    if (label) label.textContent = 'Listen';
    if (waves) waves.style.display = 'none';
    elements.speakArticleBtn.querySelector('i').className = 'fa-solid fa-volume-high';
    return;
  }

  const p = paragraphs[index];
  const utterance = new SpeechSynthesisUtterance(p.text);
  utterance.onend = () => speakParagraphSequence(paragraphs, index + 1);
  utterance.onerror = () => {
    isSpeakingArticle = false;
    if (label) label.textContent = 'Listen';
    if (waves) waves.style.display = 'none';
    elements.speakArticleBtn.querySelector('i').className = 'fa-solid fa-volume-high';
  };

  document.querySelectorAll('.article-block-wrapper').forEach(w => w.classList.remove('active-paragraph'));
  const activeBlock = document.getElementById(`block-${p.id}`);
  if (activeBlock) {
    activeBlock.classList.add('active-paragraph');
    activeBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.speechSynthesis.speak(utterance);
}

// Vocabulary Bank Management
function saveActiveWord() {
  const word = state.activeSelection;
  if (!word) return;

  const translation = elements.translationDisplay.innerText;
  const definition = state.activeWordData?.meanings?.[0]?.definition || '';
  const phonetic = state.activeWordData?.phonetic || '';

  const existingIndex = state.vocabulary.findIndex(v => v.word.toLowerCase() === word.toLowerCase());
  if (existingIndex !== -1) {
    showToast(`"${word}" is already saved in your vocabulary!`, 'success');
    return;
  }

  const vocabEntry = {
    id: 'vocab_' + Date.now(),
    word,
    translation: translation !== 'Translation will appear here...' ? translation : '',
    definition,
    phonetic,
    targetLang: state.targetLang,
    timestamp: Date.now()
  };

  state.vocabulary.unshift(vocabEntry);
  localStorage.setItem('omni_vocab', JSON.stringify(state.vocabulary));
  updateVocabBadge();
  showToast(`Saved "${word}" to Vocabulary!`, 'success');
}

function updateVocabBadge() {
  const count = state.vocabulary.length;
  if (elements.vocabBadgeCount) elements.vocabBadgeCount.textContent = count;
  if (elements.drawerVocabCount) elements.drawerVocabCount.textContent = count;
  if (elements.mobVocabBadge) elements.mobVocabBadge.textContent = count;
}

function openVocabDrawer() {
  elements.vocabDrawer.style.display = 'flex';
  renderVocabList();
}

function closeVocabDrawer() {
  elements.vocabDrawer.style.display = 'none';
  toggleFlashcardMode(false);
}

function renderVocabList(filter = '') {
  const container = elements.vocabListContainer;
  const items = state.vocabulary.filter(item => 
    !filter || item.word.toLowerCase().includes(filter) || item.translation.toLowerCase().includes(filter)
  );

  if (items.length === 0) {
    container.innerHTML = `
      <div class="vocab-empty">
        <i class="fa-regular fa-star"></i>
        <p>No saved words yet.</p>
        <small>Highlight any word while reading an article to save it here.</small>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="vocab-item-card" id="vocab-${item.id}">
      <div class="vocab-item-top">
        <span class="vocab-word-title">${escapeHtml(item.word)}</span>
        <div class="vocab-item-actions">
          <button class="icon-btn" onclick="speakText('${escapeAttr(item.word)}', 'en')" title="Listen"><i class="fa-solid fa-volume-high"></i></button>
          <button class="icon-btn" onclick="deleteVocabItem('${item.id}')" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
        </div>
      </div>
      ${item.translation ? `<div class="vocab-item-trans">${escapeHtml(item.translation)}</div>` : ''}
      ${item.definition ? `<div class="vocab-item-def">${escapeHtml(item.definition)}</div>` : ''}
    </div>
  `).join('');
}

window.deleteVocabItem = function(id) {
  state.vocabulary = state.vocabulary.filter(item => item.id !== id);
  localStorage.setItem('omni_vocab', JSON.stringify(state.vocabulary));
  updateVocabBadge();
  renderVocabList(elements.vocabSearchInput.value.trim().toLowerCase());
};

function clearAllVocabulary() {
  if (state.vocabulary.length === 0) return;
  if (confirm('Are you sure you want to clear all saved vocabulary?')) {
    state.vocabulary = [];
    localStorage.setItem('omni_vocab', JSON.stringify([]));
    updateVocabBadge();
    renderVocabList();
    showToast('Vocabulary cleared.', 'success');
  }
}

function exportVocabulary() {
  if (state.vocabulary.length === 0) {
    showToast('No vocabulary words to export.', 'error');
    return;
  }

  const csvRows = ['Word,Translation,Phonetic,Definition,Date'];
  state.vocabulary.forEach(v => {
    const row = [
      `"${v.word.replace(/"/g, '""')}"`,
      `"${v.translation.replace(/"/g, '""')}"`,
      `"${v.phonetic.replace(/"/g, '""')}"`,
      `"${v.definition.replace(/"/g, '""')}"`,
      new Date(v.timestamp).toLocaleDateString()
    ];
    csvRows.push(row.join(','));
  });

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `omniarticle_vocabulary_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Vocabulary exported as CSV!', 'success');
}

// Flashcard Study Mode
function toggleFlashcardMode(active) {
  if (active && state.vocabulary.length === 0) {
    showToast('Save some words to your vocabulary first!', 'error');
    return;
  }

  elements.flashcardSection.style.display = active ? 'flex' : 'none';
  elements.vocabListContainer.style.display = active ? 'none' : 'flex';

  if (active) {
    state.currentFlashcardIndex = 0;
    showFlashcard(0);
  }
}

function showFlashcard(index) {
  const item = state.vocabulary[index];
  if (!item) return;

  state.flashcardFlipped = false;
  elements.flashcardCard.classList.remove('flipped');

  elements.flashcardCounter.textContent = `Card ${index + 1} of ${state.vocabulary.length}`;
  elements.fcWord.textContent = item.word;
  elements.fcPhonetic.textContent = item.phonetic || '';
  elements.fcTranslation.textContent = item.translation || 'No translation';
  elements.fcDefinition.textContent = item.definition || 'No definition stored.';
}

window.flipFlashcard = function() {
  state.flashcardFlipped = !state.flashcardFlipped;
  elements.flashcardCard.classList.toggle('flipped', state.flashcardFlipped);
};

window.nextFlashcard = function() {
  if (state.currentFlashcardIndex < state.vocabulary.length - 1) {
    state.currentFlashcardIndex++;
    showFlashcard(state.currentFlashcardIndex);
  } else {
    state.currentFlashcardIndex = 0;
    showFlashcard(0);
  }
};

window.prevFlashcard = function() {
  if (state.currentFlashcardIndex > 0) {
    state.currentFlashcardIndex--;
    showFlashcard(state.currentFlashcardIndex);
  }
};

// Custom Article Modal
function openCustomArticleModal() {
  elements.customModal.style.display = 'flex';
  elements.customTitle.focus();
}

function closeCustomArticleModal() {
  elements.customModal.style.display = 'none';
}

function submitCustomArticle() {
  const title = elements.customTitle.value.trim() || 'Custom Article';
  const author = elements.customAuthor.value.trim() || 'Reader Note';
  const siteName = elements.customSource.value.trim() || 'Manual Input';
  const rawContent = elements.customContent.value.trim();

  if (!rawContent) {
    showToast('Please paste some article content.', 'error');
    return;
  }

  const paragraphs = rawContent.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 5);
  const blocks = paragraphs.map((text, idx) => ({
    type: 'paragraph',
    id: `p-${idx}`,
    text
  }));

  const totalWords = rawContent.split(/\s+/).length;

  const articleData = {
    title,
    author,
    siteName,
    publishedTime: new Date().toISOString(),
    blocks,
    wordCount: totalWords,
    readingTimeMinutes: Math.max(1, Math.ceil(totalWords / 200))
  };

  closeCustomArticleModal();
  renderArticle(articleData);
  showToast('Custom article loaded into reader!', 'success');
}

// Reset to Home
function resetToHome() {
  state.currentArticle = null;
  state.translatedParagraphs.clear();
  elements.urlInput.value = '';
  elements.clearUrlBtn.style.display = 'none';
  elements.readingProgressBar.style.width = '0%';
  showState('welcome');
}

// Switch Reader Section State
function showState(stateName) {
  elements.welcomeState.style.display = stateName === 'welcome' ? 'block' : 'none';
  elements.loadingState.style.display = stateName === 'loading' ? 'block' : 'none';
  elements.errorState.style.display = stateName === 'error' ? 'block' : 'none';
  elements.articleCard.style.display = stateName === 'article' ? 'block' : 'none';
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? 'fa-check' : type === 'error' ? 'fa-triangle-exclamation' : 'fa-info';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;

  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
