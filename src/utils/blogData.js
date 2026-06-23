import { BLOG_ARTICLES_KO } from './blogData_ko.js';
import { BLOG_ARTICLES_EN } from './blogData_en.js';
import { BLOG_ARTICLES_JA } from './blogData_ja.js';
import { BLOG_ARTICLES_ZH } from './blogData_zh.js';

export { BLOG_ARTICLES_KO, BLOG_ARTICLES_EN, BLOG_ARTICLES_JA, BLOG_ARTICLES_ZH };

// Maintain backward compatibility for any default imports
export const BLOG_ARTICLES = BLOG_ARTICLES_KO;

export const getBlogArticles = (lang) => {
  if (lang === 'en') return BLOG_ARTICLES_EN;
  if (lang === 'ja') return BLOG_ARTICLES_JA;
  if (lang === 'zh') return BLOG_ARTICLES_ZH;
  return BLOG_ARTICLES_KO;
};
