# OmniArticle — Universal Article Reader & Multi-Language Translator

> A distraction-free, intelligent web application designed to fetch, read, and translate articles from **any website on the internet** into **30+ languages**, complete with interactive vocabulary analysis, pronunciation, and bilingual dual-view.

---

## ✨ Features

### 🌐 1. Universal Article Extraction
- **Any Website, Not Just One Source**: Works across *The Indian Express*, *BBC*, *The Hindu*, *Times of India*, *TechCrunch*, *Wikipedia*, *Medium*, *Substack*, academic blogs, and global news outlets.
- **Smart Mozilla Readability Engine**: Cleans out advertisements, cookie banners, tracking scripts, and navigation clutter to present a clean, high-readability text layout.
- **Fallback Scraping**: Tailored extractors for edge cases, ensuring robust parsing even on non-standard article structures.
- **Custom / Paste Article Mode**: Paste raw text from offline documents, paywalled articles, newsletters, or PDFs with full reader and translation capabilities.
- **Curated 1-Click Samples**: Instantly load featured articles in AI & Technology, Space Exploration, and Global News to test without needing an external link.

### 🌍 2. Multi-Language Translation Pipeline
- **30+ Supported Languages**: Translate into Hindi, Spanish, French, German, Japanese, Chinese, Arabic, Russian, Portuguese, Italian, Bengali, Telugu, Marathi, Tamil, Urdu, and more.
- **Multi-tier Translation Fallback**:
  - Google Translate GTX (high accuracy, auto source detection, fast)
  - Lingva public instances fallback
  - MyMemory translated API fallback
- **Server-side In-Memory Cache**: Repeated requests are returned instantly without redundant network calls.

### 📖 3. Interactive Reading & Learning
- **Highlight-to-Inspect**: Select any word, phrase, or sentence to see instant translations, pronunciation, and dictionary definitions.
- **Word Inspector**:
  - Phonetic transcriptions and audio pronunciation
  - Grammatical part of speech (Noun, Verb, Adjective, etc.)
  - Clear definitions and example sentences
  - Clickable synonyms and antonyms chips
- **Bilingual Dual View (Side-by-Side)**: View original text and translated text side-by-side with synchronized paragraph hover highlighting.
- **Inline Paragraph Translation**: One-click translation toggle under any individual paragraph.
- **Full Article Translation**: Translate all paragraphs with real-time progress tracking.

### 📚 4. Vocabulary Bank & Flashcard Study Mode
- **Save Words**: Star any word while reading to save it to your personal Vocabulary Notebook with its definition and translation.
- **Interactive Flashcards**: Study mode with 3D flip-card animations to test your recall.
- **Export Data**: Export saved words as CSV or JSON for Anki or language learning tools.

### 🎧 5. Accessibility & Audio
- **Text-to-Speech (TTS)**: Listen to English or target-language text read aloud with natural browser speech synthesis.
- **Sequential Article Reader**: Audio play/pause controls to read the entire article paragraph-by-paragraph.
- **Reading Progress Bar**: Visual progress indicator as you scroll.
- **Estimated Reading Time & Word Count**: Automatically calculated per article.

### 🎨 6. Reader Customization
- **Color Themes**: Light Mode, Dark Mode (OLED-friendly), and Warm Sepia Paper Mode.
- **Typography Options**: Modern Sans (Inter), Editorial Serif (Merriweather), and Dyslexic-friendly font.
- **Font Size & Line Spacing Controls**: Adjustable font size and line height.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
# Navigate to the project directory
cd project-01-OmniArticle

# Install dependencies
npm install

# Start the server
npm start
```

For development with hot reload:
```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/fetch-article` | Extracts clean article content, title, metadata, and structured blocks from any URL |
| `POST` | `/api/translate` | Translates text into target language (`{ text, targetLang, sourceLang }`) |
| `POST` | `/api/translate-batch` | Translates an array of paragraph texts with batching |
| `GET` | `/api/dictionary` | Returns phonetic, definitions, parts of speech, synonyms, and antonyms for a word (`?word=...`) |
| `GET` | `/api/languages` | Returns list of all 30+ supported target languages |
| `GET` | `/api/samples` | Returns curated featured sample articles |

---

## 📁 Project Structure

```
project-01-OmniArticle/
├── package.json               # Dependencies and npm scripts
├── package-lock.json          # Dependency lockfile
├── server.js                  # Express backend, scrapers & translation endpoints
├── public/                    # Frontend static assets
│   ├── index.html             # Main reader UI, drawers, modals
│   ├── css/
│   │   └── styles.css         # Responsive styling, themes, animations
│   └── js/
│       └── app.js             # Client state, speech, dictionary, dual-view
└── README.md                  # Project documentation
```

---

## 📄 License
ISC
