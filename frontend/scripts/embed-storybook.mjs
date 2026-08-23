import { readFileSync, writeFileSync } from 'node:fs';

const INDEX_PATH = 'public/storybook/index.html';
const BASE_TAG = '<base href="/storybook/" />';

const html = readFileSync(INDEX_PATH, 'utf8');
if (!html.includes(BASE_TAG)) {
  writeFileSync(INDEX_PATH, html.replace('<head>', `<head>\n    ${BASE_TAG}`));
}
