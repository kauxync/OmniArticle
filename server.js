const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 3000;

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

app.use(cors());
app.use(express.json());

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Indian Express Reader & Translator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', 'Noto Sans Devanagari', sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; background-color: #f9f9f9; -webkit-user-select: none; user-select: none; }
        .article-section { -webkit-user-select: text; user-select: text; }
        header { background: #1a1a1a; padding: 15px 20px; display: flex; gap: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 10; }
        header input { flex: 1; padding: 10px; font-size: 16px; border: none; border-radius: 4px; font-family: inherit; }
        header button { padding: 10px 20px; font-size: 16px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; transition: background 0.3s; font-family: inherit; font-weight: 500; }
        header button:hover { background: #c0392b; }
        header button:disabled { background: #888; cursor: not-allowed; }
        .container { display: flex; flex: 1; height: calc(100vh - 66px); }
        .article-section { width: 60%; height: 100%; overflow-y: auto; padding: 40px; background: #ffffff; line-height: 1.8; font-size: 17px; }
        .article-title { font-size: 30px; font-weight: 700; margin-bottom: 20px; color: #1a1a1a; border-bottom: 2px solid #e74c3c; padding-bottom: 12px; letter-spacing: -0.3px; }
        .article-meta { font-size: 13px; color: #888; margin-bottom: 10px; font-weight: 500; }
        .article-content p { margin-bottom: 16px; color: #333; line-height: 1.9; }
        .sidebar { width: 40%; height: 100%; position: fixed; right: 0; top: 66px; background: #f4f6f7; padding: 28px; border-left: 1px solid #ddd; overflow-y: auto; box-shadow: -2px 0 5px rgba(0,0,0,0.05); }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 18px; }
        .card h3 { margin-bottom: 14px; color: #333; font-size: 16px; font-weight: 600; border-bottom: 1px solid #eee; padding-bottom: 8px; letter-spacing: 0.3px; }
        .result-box { min-height: 50px; color: #555; font-size: 16px; line-height: 1.7; }
        .hindi-text { font-family: 'Noto Sans Devanagari', sans-serif; font-size: 20px; font-weight: 500; color: #222; }
        .synonym-tag { display: inline-block; background: #e1f0fa; color: #2980b9; padding: 5px 12px; border-radius: 15px; margin: 0 5px 6px 0; font-size: 14px; font-weight: 500; }
        .loader { color: #888; font-style: italic; }
        .error { color: #e74c3c; background: #fdecea; padding: 12px; border-radius: 6px; text-align: center; }
    </style>
</head>
<body>

    <header>
        <input type="text" id="urlInput" placeholder="Paste The Indian Express Article URL here...">
        <button id="fetchBtn" onclick="fetchArticle()">Read Article</button>
    </header>

    <div class="container">
        <div class="article-section" id="articleArea">
            <div id="articleTitle" class="article-title">Welcome</div>
            <div id="articleContent" class="article-content">
                <p>Paste a link to an Indian Express article in the input bar above and click "Read Article".</p>
                <p>Once loaded, <strong>highlight/select any text</strong> in this area to instantly translate it into Hindi and view English synonyms on the right sidebar.</p>
            </div>
        </div>

        <div class="sidebar">
            <div class="card">
                <h3>Selected Text</h3>
                <div id="selectedTextDisplay" class="result-box">Highlight text to see it here...</div>
            </div>
            <div class="card">
                <h3>Hindi Translation</h3>
                <div id="translationDisplay" class="result-box">Translation will appear here...</div>
            </div>
            <div class="card">
                <h3>Synonyms (If single word selected)</h3>
                <div id="synonymDisplay" class="result-box">Synonyms will appear here...</div>
            </div>
        </div>
    </div>

    <script>
        const fetchBtn = document.getElementById('fetchBtn');
        const urlInput = document.getElementById('urlInput');
        urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') fetchArticle(); });

        async function fetchArticle() {
            const url = urlInput.value.trim();
            if (!url) { alert("Please enter a valid URL."); return; }

            fetchBtn.disabled = true;
            fetchBtn.textContent = 'Fetching...';
            document.getElementById('articleTitle').innerHTML = 'Fetching article...';
            document.getElementById('articleContent').innerHTML = '<p class="loader">Please wait, extracting content...</p>';

            try {
                const res = await fetch('/api/fetch-article', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                let html = '';
                if (data.author) html += '<div class="article-meta">By ' + data.author + '</div>';
                const paragraphs = data.content.split('\\n').filter(p => p.trim());
                paragraphs.forEach(p => { html += '<p>' + p.trim() + '</p>'; });

                document.getElementById('articleTitle').innerHTML = data.title || 'No title found';
                document.getElementById('articleContent').innerHTML = html || '<p>Could not extract article text.</p>';
            } catch (err) {
                document.getElementById('articleTitle').innerHTML = 'Error';
                document.getElementById('articleContent').innerHTML = '<div class="error">' + err.message + '</div>';
            } finally {
                fetchBtn.disabled = false;
                fetchBtn.textContent = 'Read Article';
            }
        }

        let debounceTimer;
        let lastSelection = '';
        document.addEventListener('selectionchange', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                let selectedText = window.getSelection().toString().trim();
                if (selectedText.length > 0 && selectedText !== lastSelection) {
                    lastSelection = selectedText;
                    document.getElementById('selectedTextDisplay').innerText = selectedText;
                    translateToHindi(selectedText);
                    if (!selectedText.includes(' ') && selectedText.match(/^[a-zA-Z]+$/)) {
                        fetchSynonyms(selectedText);
                    } else {
                        document.getElementById('synonymDisplay').innerHTML = '<em>Select a single word to see synonyms.</em>';
                    }
                }
            }, 300);
        });

        async function translateToHindi(text) {
            const el = document.getElementById('translationDisplay');
            el.innerHTML = '<span class="loader">Translating...</span>';
            try {
                const res = await fetch('/api/translate?text=' + encodeURIComponent(text));
                const data = await res.json();
                if (data.translation) {
                    el.innerHTML = '<span class="hindi-text">' + data.translation + '</span>';
                } else {
                    el.innerText = 'Translation failed.';
                }
            } catch (e) {
                el.innerText = 'Error reaching translation service.';
            }
        }

        async function fetchSynonyms(word) {
            const el = document.getElementById('synonymDisplay');
            el.innerHTML = '<span class="loader">Finding synonyms...</span>';
            try {
                const res = await fetch('https://api.datamuse.com/words?rel_syn=' + encodeURIComponent(word) + '&max=10');
                const data = await res.json();
                if (data.length > 0) {
                    el.innerHTML = data.slice(0, 10).map(s => '<span class="synonym-tag">' + s.word + '</span>').join('');
                } else {
                    el.innerHTML = '<em>No synonyms found.</em>';
                }
            } catch (e) {
                el.innerText = 'Error reaching dictionary service.';
            }
        }
    </script>

</body>
</html>`;

app.get('/', (req, res) => {
  res.send(HTML_PAGE);
});

app.get('/api/translate', async (req, res) => {
  const { text } = req.query;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  const key = text.toLowerCase().trim();

  if (cache.has(key)) {
    return res.json(cache.get(key));
  }

  try {
    const { data } = await axios.get(
      'https://lingva.ml/api/v1/en/hi/' + encodeURIComponent(text),
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 3000,
      }
    );
    const result = { translation: data.translation || '', transliteration: '' };
    cache.set(key, result);
    setTimeout(() => cache.delete(key), CACHE_TTL);
    res.json(result);
  } catch (error) {
    try {
      const { data } = await axios.get(
        'https://api.mymemory.translated.net/get',
        { params: { q: text, langpair: 'en|hi' }, timeout: 3000 }
      );
      const result = { translation: data.responseData?.translatedText || '', transliteration: '' };
      cache.set(key, result);
      setTimeout(() => cache.delete(key), CACHE_TTL);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'Translation failed' });
    }
  }
});

app.post('/api/fetch-article', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    let title = '';
    if ($('h1').length) {
      title = $('h1').first().text().trim();
    } else if ($('.article-title').length) {
      title = $('.article-title').first().text().trim();
    } else if ($('title').length) {
      title = $('title').text().trim();
    }

    let articleText = '';
    const selectors = [
      '.article-body',
      '.text-description',
      '.content-article',
      '#pcl-full-content',
      '.articles-listing-content',
      '.story-article',
      'article .content',
      '.post-content',
      '.entry-content',
    ];

    for (const sel of selectors) {
      if ($(sel).length) {
        $(sel).find('p').each((_, el) => {
          const text = $(el).text().trim();
          if (text.length > 20) {
            articleText += text + '\n\n';
          }
        });
        if (articleText) break;
      }
    }

    if (!articleText) {
      $('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && !text.includes('cookie') && !text.includes('privacy')) {
          articleText += text + '\n\n';
        }
      });
    }

    let image = '';
    const imgSelectors = [
      '.article-img img',
      '.story-img img',
      '.featured-image img',
      'article img',
      'meta[property="og:image"]',
    ];

    for (const sel of imgSelectors) {
      if ($(sel).length) {
        image = $(sel).first().attr('src') || $(sel).first().attr('content') || '';
        if (image) break;
      }
    }

    let author = '';
    const authorSelectors = ['.author-name', '.article-author', '.byline', '.author'];
    for (const sel of authorSelectors) {
      if ($(sel).length) {
        author = $(sel).first().text().trim().replace(/^By\\s*/i, '');
        if (author) break;
      }
    }

    res.json({ title, content: articleText.trim(), image, author, url });

  } catch (error) {
    console.error('Fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch article. Please check the URL and try again.' });
  }
});

app.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
