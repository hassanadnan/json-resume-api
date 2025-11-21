// PDF generator using Puppeteer and theme renderers
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import puppeteer from 'puppeteer-core';

const require = createRequire(import.meta.url);

export async function generatePDF(resumeData, theme = undefined) {
  try {
    // 1) Render HTML via theme
    const html = renderHTMLWithTheme(require, resumeData, theme);

    // 2) Launch puppeteer (system Chromium in Docker)
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ];

    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args,
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
        preferCSSPageSize: true,
      });
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  } finally {
    // No temporary files to cleanup
  }
}

function renderHTMLWithTheme(require, resumeData, theme) {
  const map = {
    kendall: 'jsonresume-theme-kendall',
    elegant: 'jsonresume-theme-elegant',
    flat: 'jsonresume-theme-flat',
    'paper-plus-plus': 'jsonresume-theme-paper-plus-plus',
  };
  const key = (theme || 'elegant').toLowerCase();
  const pkg = map[key] || map['elegant'];

  let mod;
  try {
    mod = require(pkg);
  } catch {
    // Try explicit index
    mod = require(`${pkg}/index.js`);
  }
  const renderer = mod?.render || mod?.default?.render;
  if (typeof renderer !== 'function') {
    throw new Error(`Theme '${key}' does not export a render() function`);
  }
  return renderer(resumeData);
}

