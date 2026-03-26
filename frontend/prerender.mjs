import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock browser globals for SSR
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toAbsolute = (p) => path.resolve(__dirname, p);

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8');
const { render } = await import('./dist/server/entry-server.js');

// Blog post IDs from blogData.ts
const blogIds = [1, 2, 3, 4, 5, 6, 7, 8];

const routesToPrerender = [
  '/',
  '/features',
  '/architecture',
  '/blog',
  '/contact',
  '/privacy',
  ...blogIds.map(id => `/blog/${id}`),
];

for (const url of routesToPrerender) {
  const { html: appHtml, headTags } = render(url);

  const rendered = template
    .replace('<!--app-head-->', headTags || '')
    .replace('<!--app-html-->', appHtml);

  const filePath = url === '/'
    ? toAbsolute('dist/index.html')
    : toAbsolute(`dist${url}/index.html`);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, rendered);
  console.log(`✓ Prerendered: ${url}`);
}
