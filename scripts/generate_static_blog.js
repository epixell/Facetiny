import fs from 'fs';
import path from 'path';
import { BLOG_ARTICLES } from '../src/utils/blogData.js';

const PUBLIC_DIR = path.resolve('public');
const BLOG_DIR = path.join(PUBLIC_DIR, 'blog');

// Ensure directories exist
if (!fs.existsSync(BLOG_DIR)) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
}

// Markdown to HTML simple parser
function parseMarkdownToHtml(text) {
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  let listType = ''; // 'ul' or 'ol'

  const flushList = () => {
    if (inList) {
      html += `</${listType}>\n`;
      inList = false;
      listType = '';
    }
  };

  lines.forEach(line => {
    let trimmed = line.trim();

    // Parse inline links [text](art_X) -> <a href="/blog/art_X/">text</a>
    trimmed = trimmed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, targetId) => {
      return `<a href="/blog/${targetId}/" class="article-link">${linkText}</a>`;
    });

    // Parse inline bolding **text** -> <strong>text</strong>
    trimmed = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 1. Heading 2 (##)
    if (trimmed.startsWith('## ')) {
      flushList();
      const headerText = trimmed.replace('## ', '');
      html += `<h2 class="section-title">${headerText}</h2>\n`;
      return;
    }

    // 2. Heading 3 (###)
    if (trimmed.startsWith('### ')) {
      flushList();
      const headerText = trimmed.replace('### ', '');
      html += `<h3 class="subsection-title">${headerText}</h3>\n`;
      return;
    }

    // 3. Unordered list (*, -, •)
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!inList || listType !== 'ul') {
        flushList();
        html += `<ul class="article-list">\n`;
        inList = true;
        listType = 'ul';
      }
      const itemText = trimmed.replace(/^(\*\s|-\s|•\s)/, '');
      html += `  <li>${itemText}</li>\n`;
      return;
    }

    // 4. Ordered list (1., 2., 3., etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      if (!inList || listType !== 'ol') {
        flushList();
        html += `<ol class="article-list" style="list-style-type: decimal;">\n`;
        inList = true;
        listType = 'ol';
      }
      const itemText = trimmed.replace(/^\d+\.\s/, '');
      html += `  <li>${itemText}</li>\n`;
      return;
    }

    // 5. Empty line
    if (trimmed === '') {
      flushList();
      return;
    }

    // 6. Callout line starting with 👉
    if (trimmed.startsWith('👉')) {
      flushList();
      html += `<div class="callout-box">${trimmed}</div>\n`;
      return;
    }

    // 7. Regular paragraph
    flushList();
    html += `<p class="article-paragraph">${trimmed}</p>\n`;
  });

  flushList();
  return html;
}

// Generate static HTML for each article
console.log("Generating static blog pages...");
BLOG_ARTICLES.forEach(art => {
  const articleHtml = parseMarkdownToHtml(art.content);
  const dirPath = path.join(BLOG_DIR, art.id);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const pageTitle = `${art.title} - AI 관상 학술 백과 | Facetiny`;
  const pageDescription = art.summary;
  const canonicalUrl = `https://facetiny.pages.dev/blog/${art.id}/`;

  const htmlTemplate = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}">
  <link rel="canonical" href="${canonicalUrl}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDescription}">
  
  <!-- CSS Styling for Premium Aesthetics -->
  <style>
    :root {
      --bg-color: #0f172a;
      --panel-bg: rgba(30, 41, 59, 0.4);
      --border-color: rgba(0, 242, 254, 0.15);
      --text-main: #f8fafc;
      --text-muted: #cbd5e1;
      --accent: #00f2fe;
      --accent-gradient: linear-gradient(135deg, #00f2fe, #4facfe);
    }
    
    body {
      margin: 0;
      padding: 0;
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: 'Inter', 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.8;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 32px;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 900;
      color: #fff;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .logo span {
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .btn-cta {
      background: var(--accent-gradient);
      border: none;
      color: #fff;
      padding: 8px 16px;
      border-radius: 12px;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 242, 254, 0.2);
    }

    .btn-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 242, 254, 0.4);
    }

    .article-card {
      background: var(--panel-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }

    .meta-tag {
      background: rgba(0, 242, 254, 0.1);
      color: var(--accent);
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 20px;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 2.2rem;
      font-weight: 900;
      margin-top: 0;
      margin-bottom: 24px;
      line-height: 1.3;
      color: #fff;
      letter-spacing: -0.02em;
    }

    .section-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #fff;
      margin-top: 36px;
      margin-bottom: 16px;
      border-left: 4px solid var(--accent);
      padding-left: 12px;
      line-height: 1.4;
    }

    .subsection-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--accent);
      margin-top: 24px;
      margin-bottom: 12px;
      line-height: 1.4;
    }

    .article-paragraph {
      margin-bottom: 18px;
      color: var(--text-muted);
      font-size: 1.02rem;
    }

    .article-list {
      padding-left: 24px;
      margin-bottom: 20px;
      color: var(--text-muted);
    }

    .article-list li {
      margin-bottom: 8px;
    }

    .callout-box {
      margin: 28px 0;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(0, 242, 254, 0.05);
      border: 1px solid rgba(0, 242, 254, 0.2);
    }

    .article-link {
      color: var(--accent);
      text-decoration: underline;
      font-weight: 600;
    }

    .article-link:hover {
      color: #fff;
    }

    footer {
      margin-top: 60px;
      padding-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    .footer-links {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
      margin-bottom: 24px;
    }

    .footer-links a {
      color: var(--text-muted);
      text-decoration: none;
      background: rgba(255, 255, 255, 0.03);
      padding: 6px 12px;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: all 0.2s;
    }

    .footer-links a:hover {
      background: rgba(0, 242, 254, 0.08);
      border-color: rgba(0, 242, 254, 0.3);
      color: var(--accent);
    }
  </style>
  
  <!-- Auto-Ads script for Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9223338549663525"
     crossorigin="anonymous"></script>
</head>
<body>
  <div class="container">
    <header>
      <a href="/" class="logo">🔮 Facetiny <span>AI 관상</span></a>
      <a href="/" class="btn-cta">실시간 무료 스캔 시작</a>
    </header>

    <article class="article-card">
      <span class="meta-tag">${art.category}</span>
      <h1>${art.title}</h1>
      
      <div class="article-body">
        ${articleHtml}
      </div>
    </article>

    <footer>
      <div>© 2026 Facetiny. All rights reserved. 본 정보는 학술적 분석과 재미를 위한 내용이며 의학적 판단을 대체하지 않습니다.</div>
      <div class="footer-links">
        ${BLOG_ARTICLES.map(b => `<a href="/blog/${b.id}/">${b.title.split('(')[0].split(':')[0]}</a>`).join('\n        ')}
      </div>
      <div>
        <a href="/privacy.html" style="color: var(--text-muted); margin-right: 12px;">개인정보처리방침</a>
        <a href="/terms.html" style="color: var(--text-muted); margin-right: 12px;">이용약관</a>
        <a href="/adsense-policy.html" style="color: var(--text-muted);">애드센스 정책안내</a>
      </div>
    </footer>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(dirPath, 'index.html'), htmlTemplate, 'utf-8');
});

// Generate sitemap.xml
console.log("Generating sitemap.xml...");
const sitemapUrls = [
  'https://facetiny.pages.dev/',
  'https://facetiny.pages.dev/privacy.html',
  'https://facetiny.pages.dev/terms.html',
  'https://facetiny.pages.dev/adsense-policy.html',
  ...BLOG_ARTICLES.map(art => `https://facetiny.pages.dev/blog/${art.id}/`)
];

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>${url.endsWith('.dev/') ? '1.0' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemapContent, 'utf-8');

// Generate robots.txt
console.log("Generating robots.txt...");
const robotsContent = `User-agent: *
Allow: /
Sitemap: https://facetiny.pages.dev/sitemap.xml
`;
fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robotsContent, 'utf-8');

// Inject hidden links into index.html
console.log("Injecting sitemap links into main index.html for crawler discovery...");
const indexHtmlPath = path.resolve('index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

const injectBlock = `
    <!-- SEO Footer for Crawlers and Accessibility -->
    <noscript>
      <div style="padding: 20px; background: #0b0f19; color: #fff; text-align: center;">
        <h2>AI 관상 학술 백과 목록 (Physiognomy Encyclopedia)</h2>
        <ul style="list-style: none; padding: 0;">
          ${BLOG_ARTICLES.map(b => `<li style="margin: 10px 0;"><a href="/blog/${b.id}/" style="color: #00f2fe; text-decoration: underline;">${b.title}</a></li>`).join('\n          ')}
        </ul>
      </div>
    </noscript>
    <div style="display: none;" aria-hidden="true">
      <h2>AI 관상 학술 백과 목록 (Physiognomy Encyclopedia)</h2>
      <ul>
        ${BLOG_ARTICLES.map(b => `<li><a href="/blog/${b.id}/">${b.title}</a></li>`).join('\n        ')}
      </ul>
    </div>
  </body>`;

// Avoid duplicate injection
if (indexHtml.includes('AI 관상 학술 백과 목록')) {
  indexHtml = indexHtml.replace(/<!-- SEO Footer for Crawlers and Accessibility -->[\s\S]*<\/body>/, injectBlock);
} else {
  indexHtml = indexHtml.replace('</body>', injectBlock);
}

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf-8');
console.log("SUCCESS: All static pages, sitemap.xml, robots.txt generated, and index.html updated!");
