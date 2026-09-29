const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const app = express();
const PORT = process.env.PORT || 3000;

// Caches
const translationCache = new Map();
const dictionaryCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 5000;

function setCache(cacheMap, key, value) {
  if (cacheMap.size >= MAX_CACHE_SIZE) {
    const firstKey = cacheMap.keys().next().value;
    cacheMap.delete(firstKey);
  }
  cacheMap.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
}

function getCache(cacheMap, key) {
  const item = cacheMap.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheMap.delete(key);
    return null;
  }
  return item.value;
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Supported Languages
const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🇵🇰' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', native: 'Polski', flag: '🇵🇱' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'sv', name: 'Swedish', native: 'Svenska', flag: '🇸🇪' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'he', name: 'Hebrew', native: 'עברית', flag: '🇮🇱' },
  { code: 'th', name: 'Thai', native: 'ไทย', flag: '🇹🇭' },
  { code: 'fa', name: 'Persian', native: 'فارسی', flag: '🇮🇷' },
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' }
];

// Curated Sample Articles
const SAMPLE_ARTICLES = [
  {
    id: 'sample-ai',
    title: 'The Evolution of Artificial Intelligence and Human Creativity',
    siteName: 'OmniArticle Technology Review',
    author: 'Elena Vance & Dr. David Zhao',
    publishedTime: 'September 2026',
    leadImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'An exploration of how modern neural architectures augment human expression, intellectual inquiry, and global communication.',
    content: [
      { type: 'paragraph', id: 'p-0', text: 'Artificial intelligence has transcended computational boundaries to become a profound catalyst for human expression and discovery. What began as deterministic logic has evolved into adaptive neural architectures capable of synthesizing language, deciphering biological blueprints, and composing intricate artistic visions.' },
      { type: 'heading', level: 2, text: 'Bridging the Linguistic Divide' },
      { type: 'paragraph', id: 'p-1', text: 'One of the most consequential triumphs of contemporary machine learning is universal language translation. For millennia, linguistic frontiers have constrained the dissemination of ideas, scientific discoveries, and cultural heritage. Today, multilingual models comprehend semantic nuances, colloquial idioms, and intricate metaphors across dozens of human languages in real time.' },
      { type: 'paragraph', id: 'p-2', text: 'Rather than replacing human intellect, these cognitive assistants augment our cognitive faculties. A scholar in Tokyo can instantly immerse themselves in a nuanced editorial published in Madrid or Mumbai, analyzing complex philosophical distinctions without relying on superficial approximations.' },
      { type: 'heading', level: 2, text: 'Curiosity as the Next Renaissance' },
      { type: 'paragraph', id: 'p-3', text: 'As mundane translation and information retrieval become frictionless, curiosity becomes the defining asset of the modern reader. When comprehension barriers dissolve, every article becomes an accessible window into unfamiliar perspectives and transformative knowledge.' },
      { type: 'paragraph', id: 'p-4', text: 'The confluence of human intuition and computational power heralds a new intellectual renaissance, where cross-cultural dialogue flourishes across every border on Earth.' }
    ]
  },
  {
    id: 'sample-space',
    title: 'Voyagers in the Deep Cosmos: Unveiling Exoplanet Atmospheres',
    siteName: 'Cosmic Horizons Observatory',
    author: 'Astrobiology Collaborative',
    publishedTime: 'August 2026',
    leadImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Deep-space infrared observatories have detected signatures of water vapor, methane, and carbon compounds in the atmospheres of distant rocky worlds.',
    content: [
      { type: 'paragraph', id: 'p-0', text: 'Astronomers peering into the cosmic abyss have registered remarkable atmospheric spectra from planets orbiting stars dozens of light-years away. Utilizing high-resolution infrared spectrographs, scientists have decoded molecular fingerprints drifting across foreign alien skies.' },
      { type: 'paragraph', id: 'p-1', text: 'Among the most intriguing discoveries is a temperate super-Earth within the habitable zone of a red dwarf star. Transmission spectroscopy revealed undeniable indications of atmospheric vapor, accompanied by traces of carbon dioxide and complex photochemical hazes.' },
      { type: 'heading', level: 2, text: 'Deciphering Cosmic Fingerprints' },
      { type: 'paragraph', id: 'p-2', text: 'When a distant exoplanet passes directly in front of its parent star, starlight filters through its fragile gaseous envelope. By measuring minuscule variations in stellar brightness at distinct wavelengths, researchers determine which chemical compounds absorb the incandescent rays.' },
      { type: 'paragraph', id: 'p-3', text: 'These spectral measurements represent humanity’s first tentative steps toward answering whether biosphere signatures exist elsewhere across the vast tapestry of the Milky Way.' }
    ]
  },
  {
    id: 'sample-news',
    title: 'Global Energy Transition Accelerates with Breakthrough Storage Systems',
    siteName: 'The Sustainable Standard',
    author: 'Aarav Sharma & Maya Lin',
    publishedTime: 'July 2026',
    leadImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    excerpt: 'Next-generation grid-scale thermal and sodium-ion batteries provide the missing link for intermittent renewable energy sources.',
    content: [
      { type: 'paragraph', id: 'p-0', text: 'The worldwide transition toward renewable infrastructure achieved an unprecedented milestone this quarter as grid-scale energy storage deployments expanded exponentially across four continents.' },
      { type: 'paragraph', id: 'p-1', text: 'Historically, the intrinsic intermittency of solar irradiance and atmospheric winds posed substantial challenges for electrical transmission networks. Without economical high-capacity reservoirs, surplus energy generated during peak hours was frequently curtailed or lost.' },
      { type: 'heading', level: 2, text: 'Sodium-Ion and Thermal Innovation' },
      { type: 'paragraph', id: 'p-2', text: 'Engineers have surmounted conventional lithium dependency by commercializing abundant sodium-ion batteries and molten-salt thermal reservoirs. These novel storage media endure thousands of charge cycles without catastrophic degradation, ensuring dependable baseload power during windless nights.' },
      { type: 'paragraph', id: 'p-3', text: 'With manufacturing costs plummeting faster than projections anticipated, metropolitan grids are progressively retiring obsolete fossil fuel infrastructure in favor of resilient, decentralized microgrids.' }
    ]
  }
];

// Helper: Translate text using robust fallback chain
async function executeTranslation(text, targetLang, sourceLang = 'auto') {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const cacheKey = `${sourceLang}-${targetLang}:${trimmed}`;
  const cached = getCache(translationCache, cacheKey);
  if (cached) return cached;

  // 1. Google Translate GTX
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': '*/*'
      },
      timeout: 8000
    });

    if (response.data && Array.isArray(response.data[0])) {
      const translated = response.data[0].map(item => item[0]).filter(Boolean).join('');
      if (translated) {
        setCache(translationCache, cacheKey, translated);
        return translated;
      }
    }
  } catch (err) {
    // Continue to next provider
  }

  // 2. Lingva API Fallback
  try {
    const sl = sourceLang === 'auto' ? 'auto' : sourceLang;
    const lingvaUrl = `https://lingva.ml/api/v1/${sl}/${targetLang}/${encodeURIComponent(trimmed)}`;
    const response = await axios.get(lingvaUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });
    if (response.data && response.data.translation) {
      const translated = response.data.translation;
      setCache(translationCache, cacheKey, translated);
      return translated;
    }
  } catch (err) {
    // Continue to next provider
  }

  // 3. MyMemory API Fallback
  try {
    const langpair = `${sourceLang === 'auto' ? 'en' : sourceLang}|${targetLang}`;
    const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${langpair}`;
    const response = await axios.get(myMemoryUrl, { timeout: 5000 });
    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const translated = response.data.responseData.translatedText;
      setCache(translationCache, cacheKey, translated);
      return translated;
    }
  } catch (err) {
    // Final fallback
  }

  throw new Error(`Unable to translate text to ${targetLang}. Please try again.`);
}

// Routes

// Get supported languages
app.get('/api/languages', (req, res) => {
  res.json({ languages: SUPPORTED_LANGUAGES });
});

// Get sample articles
app.get('/api/samples', (req, res) => {
  res.json({ samples: SAMPLE_ARTICLES });
});

// Get single sample article
app.get('/api/samples/:id', (req, res) => {
  const sample = SAMPLE_ARTICLES.find(s => s.id === req.params.id);
  if (!sample) return res.status(404).json({ error: 'Sample article not found' });
  res.json(sample);
});

// Translation Endpoint
app.post('/api/translate', async (req, res) => {
  const { text, targetLang = 'hi', sourceLang = 'auto' } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required for translation.' });
  }

  try {
    const translation = await executeTranslation(text, targetLang, sourceLang);
    res.json({ translation, targetLang });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: err.message || 'Translation service failed.' });
  }
});

// Batch Translation Endpoint (for Full Article translation)
app.post('/api/translate-batch', async (req, res) => {
  const { texts, targetLang = 'hi', sourceLang = 'auto' } = req.body;
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'Array of texts is required.' });
  }

  try {
    const results = [];
    // Process sequentially or in small batches of 3 to prevent rate limits
    for (let i = 0; i < texts.length; i += 3) {
      const chunk = texts.slice(i, i + 3);
      const chunkResults = await Promise.all(
        chunk.map(async (t) => {
          try {
            return await executeTranslation(t, targetLang, sourceLang);
          } catch (e) {
            return '';
          }
        })
      );
      results.push(...chunkResults);
    }
    res.json({ translations: results, targetLang });
  } catch (err) {
    console.error('Batch translation error:', err.message);
    res.status(500).json({ error: 'Batch translation failed.' });
  }
});

// Dictionary & Word Details Endpoint
app.get('/api/dictionary', async (req, res) => {
  const word = (req.query.word || '').trim().toLowerCase();
  if (!word) {
    return res.status(400).json({ error: 'Word query parameter is required.' });
  }

  const cached = getCache(dictionaryCache, word);
  if (cached) return res.json(cached);

  try {
    // 1. Fetch definitions and tags from Datamuse
    const [datamuseDefRes, datamuseSynRes, datamuseAntRes] = await Promise.allSettled([
      axios.get(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dp&max=1`, { timeout: 4000 }),
      axios.get(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`, { timeout: 4000 }),
      axios.get(`https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=6`, { timeout: 4000 })
    ]);

    let meanings = [];
    let synonyms = [];
    let antonyms = [];
    let phonetic = '';
    let audioUrl = '';

    if (datamuseSynRes.status === 'fulfilled' && Array.isArray(datamuseSynRes.value.data)) {
      synonyms = datamuseSynRes.value.data.map(item => item.word);
    }

    if (datamuseAntRes.status === 'fulfilled' && Array.isArray(datamuseAntRes.value.data)) {
      antonyms = datamuseAntRes.value.data.map(item => item.word);
    }

    if (datamuseDefRes.status === 'fulfilled' && Array.isArray(datamuseDefRes.value.data) && datamuseDefRes.value.data.length > 0) {
      const entry = datamuseDefRes.value.data[0];
      if (Array.isArray(entry.defs)) {
        entry.defs.forEach(defStr => {
          const parts = defStr.split('\t');
          if (parts.length >= 2) {
            const pos = parts[0] === 'n' ? 'noun' : parts[0] === 'v' ? 'verb' : parts[0] === 'adj' ? 'adjective' : parts[0] === 'adv' ? 'adverb' : parts[0];
            meanings.push({ partOfSpeech: pos, definition: parts[1].trim() });
          }
        });
      }
    }

    // 2. Try Free Dictionary API for phonetic & audio pronunciation
    try {
      const dictRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 3000 });
      if (Array.isArray(dictRes.data) && dictRes.data.length > 0) {
        const item = dictRes.data[0];
        if (item.phonetic) phonetic = item.phonetic;
        if (Array.isArray(item.phonetics)) {
          const withAudio = item.phonetics.find(p => p.audio && p.audio.startsWith('http'));
          if (withAudio) audioUrl = withAudio.audio;
          if (!phonetic) {
            const withText = item.phonetics.find(p => p.text);
            if (withText) phonetic = withText.text;
          }
        }
        if (meanings.length === 0 && Array.isArray(item.meanings)) {
          item.meanings.forEach(m => {
            if (m.definitions && m.definitions[0]) {
              meanings.push({
                partOfSpeech: m.partOfSpeech,
                definition: m.definitions[0].definition,
                example: m.definitions[0].example || ''
              });
            }
          });
        }
      }
    } catch (e) {
      // Ignore Free Dictionary API timeout
    }

    const result = {
      word,
      phonetic,
      audioUrl,
      meanings: meanings.slice(0, 4),
      synonyms: synonyms.slice(0, 8),
      antonyms: antonyms.slice(0, 6)
    };

    setCache(dictionaryCache, word, result);
    res.json(result);
  } catch (err) {
    console.error('Dictionary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dictionary data.' });
  }
});

// Universal Article Fetcher Endpoint
app.post('/api/fetch-article', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid URL is required.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'Please enter a valid website URL.' });
  }

  try {
    const response = await axios.get(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const html = response.data;
    const dom = new JSDOM(html, { url: parsedUrl.href });
    const document = dom.window.document;
    const $ = cheerio.load(html);

    // Metadata extraction via OpenGraph / Twitter Cards / Meta
    let leadImage =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="twitter:image:src"]').attr('content') ||
      '';

    let metaAuthor =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      $('meta[name="twitter:creator"]').attr('content') ||
      '';

    let metaPublished =
      $('meta[property="article:published_time"]').attr('content') ||
      $('meta[name="publish-date"]').attr('content') ||
      $('meta[name="pubdate"]').attr('content') ||
      $('time').first().text().trim() ||
      '';

    let metaSiteName =
      $('meta[property="og:site_name"]').attr('content') ||
      parsedUrl.hostname.replace(/^www\./i, '');

    // Parse with Readability
    const reader = new Readability(document, {
      charThreshold: 20,
      keepClasses: false
    });
    const article = reader.parse();

    let title = '';
    let author = metaAuthor;
    let siteName = metaSiteName;
    let excerpt = '';
    let blocks = [];
    let pCounter = 0;

    if (article && article.content) {
      title = article.title || $('title').text().trim();
      if (article.byline && !author) author = article.byline;
      if (article.siteName) siteName = article.siteName;
      if (article.excerpt) excerpt = article.excerpt;

      // Parse Readability HTML output into clean structured blocks
      const $content = cheerio.load(article.content);

      $content('*').each((_, el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'p') {
          const text = $content(el).text().trim().replace(/\s+/g, ' ');
          if (text.length > 25 && !text.toLowerCase().includes('subscribe now') && !text.toLowerCase().includes('all rights reserved')) {
            blocks.push({
              type: 'paragraph',
              id: `p-${pCounter++}`,
              text
            });
          }
        } else if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
          const text = $content(el).text().trim();
          if (text.length > 3 && text.length < 150) {
            blocks.push({
              type: 'heading',
              level: parseInt(tag.charAt(1)),
              text
            });
          }
        } else if (tag === 'blockquote') {
          const text = $content(el).text().trim();
          if (text) {
            blocks.push({
              type: 'quote',
              text
            });
          }
        }
      });
    }

    // Fallback if Readability extracted fewer than 2 paragraphs
    if (blocks.length < 2) {
      title = title || $('h1').first().text().trim() || $('.article-title').first().text().trim() || $('title').text().trim();

      const articleSelectors = [
        '#pcl-full-content',
        '.article-body',
        '.story-details',
        '.story-article',
        '.text-description',
        '.content-article',
        '.articles-listing-content',
        'article .content',
        'article',
        '.post-content',
        '.entry-content',
        '.main-content',
        '.story-body'
      ];

      for (const sel of articleSelectors) {
        if ($(sel).length) {
          $(sel).find('p').each((_, el) => {
            const text = $(el).text().trim().replace(/\s+/g, ' ');
            if (text.length > 30 && !text.toLowerCase().includes('click here') && !text.toLowerCase().includes('sign up')) {
              blocks.push({
                type: 'paragraph',
                id: `p-${pCounter++}`,
                text
              });
            }
          });
          if (blocks.length >= 2) break;
        }
      }

      if (blocks.length === 0) {
        $('p').each((_, el) => {
          const text = $(el).text().trim().replace(/\s+/g, ' ');
          if (text.length > 45 && !text.toLowerCase().includes('cookie') && !text.toLowerCase().includes('privacy policy')) {
            blocks.push({
              type: 'paragraph',
              id: `p-${pCounter++}`,
              text
            });
          }
        });
      }
    }

    // Check for author fallback
    if (!author) {
      const authorSelectors = ['.author-name', '.article-author', '.byline', '.author', '[rel="author"]'];
      for (const sel of authorSelectors) {
        if ($(sel).length) {
          author = $(sel).first().text().trim().replace(/^By\s*/i, '');
          if (author) break;
        }
      }
    }

    // Check for image fallback
    if (!leadImage) {
      $('article img, .article-img img, .story-img img, .featured-image img, figure img').each((_, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.startsWith('http') && !leadImage) {
          leadImage = src;
        }
      });
    }

    if (blocks.length === 0) {
      return res.status(422).json({
        error: 'Could not extract article content automatically. The website might be behind a strict paywall or bot protection. You can use the "Paste / Custom Article" tab to read and translate it directly!'
      });
    }

    // Calculate reading stats
    const totalWords = blocks
      .filter(b => b.type === 'paragraph')
      .reduce((acc, b) => acc + b.text.split(/\s+/).length, 0);

    const readingTimeMinutes = Math.max(1, Math.ceil(totalWords / 200));

    res.json({
      success: true,
      url: parsedUrl.href,
      siteName,
      title: title || 'Untitled Article',
      author: author || 'Staff Writer',
      publishedTime: metaPublished,
      leadImage,
      excerpt,
      wordCount: totalWords,
      readingTimeMinutes,
      blocks
    });

  } catch (error) {
    console.error('Fetch error:', error.message);
    let errorMsg = 'Failed to fetch article. Please check the URL and try again.';
    if (error.code === 'ENOTFOUND') errorMsg = 'Could not resolve domain name. Please check the URL.';
    if (error.response && error.response.status === 403) {
      errorMsg = 'This website blocked automated access (403 Forbidden). Try pasting the article text using the "Paste Article" button.';
    } else if (error.response && error.response.status === 404) {
      errorMsg = 'Article page not found (404). Please verify the link.';
    }

    res.status(500).json({ error: errorMsg });
  }
});

// Root route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Universal Article Reader & Translator running at http://localhost:${PORT}`);
});
