// PDF generator using resume-cli (no Puppeteer)
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { createRequire } from 'module';

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

function resolveThemePath(theme) {
  if (!theme || typeof theme !== 'string') return null;
  const normalized = theme.toLowerCase();
  const map = {
    kendall: 'jsonresume-theme-kendall',
    elegant: 'jsonresume-theme-elegant',
    flat: 'jsonresume-theme-flat',
    'paper-plus-plus': 'jsonresume-theme-paper-plus-plus',
  };
  const pkg = map[normalized];
  if (!pkg) return null;
  // Try resolve package entrypoint
  try {
    return require.resolve(pkg);
  } catch {}
  // Try index.js within package
  try {
    return require.resolve(`${pkg}/index.js`);
  } catch {}
  // Fallback to node_modules absolute guess
  const guessed = join(process.cwd(), 'node_modules', pkg, 'index.js');
  if (existsSync(guessed)) return guessed;
  return null;
}

function getResumeCliCommand() {
  // Prefer local binary if available, else fallback to npx
  const localUnix = join(process.cwd(), 'node_modules', '.bin', 'resume');
  const localWin = join(process.cwd(), 'node_modules', '.bin', 'resume.cmd');

  if (existsSync(localUnix)) return `"${localUnix}"`;
  if (existsSync(localWin)) return `"${localWin}"`;

  // npx uses local dependency when available
  return 'npx --yes resume-cli';
}

export async function generatePDF(resumeData, theme = undefined) {
  const tmp = tmpdir();
  const ts = Date.now();
  const resumeFile = join(tmp, `resume-${ts}.json`);
  const pdfFile = join(tmp, `resume-${ts}.pdf`);

  const resumeCli = getResumeCliCommand();

  try {
    // Write resume JSON to a temporary file
    await writeFile(resumeFile, JSON.stringify(resumeData, null, 2), 'utf8');

    // Build command - try absolute theme path if available
    const themePath = theme ? resolveThemePath(theme) : null;
    const themeArg = themePath ? ` --theme "${themePath}"` : (theme ? ` --theme ${theme}` : '');
    const cmd = `${resumeCli} export "${pdfFile}"${themeArg} --resume "${resumeFile}"`;

    // Execute resume-cli to export PDF
    const baseEnv = {
      ...process.env,
      NO_COLOR: '1',
      // Force puppeteer to use system Chromium in container
      PUPPETEER_EXECUTABLE_PATH: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'true',
      // Some environments respect CHROMIUM_FLAGS; include common flags
      CHROMIUM_FLAGS: process.env.CHROMIUM_FLAGS || '--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage',
    };
    try {
      const { stdout, stderr } = await execAsync(cmd, { env: baseEnv });
      if (stdout) console.error('[resume-cli stdout]', stdout);
      if (stderr) console.error('[resume-cli stderr]', stderr);
    } catch (err) {
      const e = err;
      if (e?.stdout) console.error('[resume-cli stdout]', e.stdout);
      if (e?.stderr) console.error('[resume-cli stderr]', e.stderr);
      throw err;
    }

    // Read generated PDF
    const pdfBuffer = await readFile(pdfFile);

    return pdfBuffer;
  } catch (error) {
    // If a theme is missing, retry once without theme to use CLI default
    if (theme) {
      try {
        const fallbackCmd = `${resumeCli} export "${pdfFile}" --resume "${resumeFile}"`;
        try {
          const { stdout, stderr } = await execAsync(fallbackCmd, { env: baseEnv });
          if (stdout) console.error('[resume-cli fallback stdout]', stdout);
          if (stderr) console.error('[resume-cli fallback stderr]', stderr);
        } catch (err2) {
          const e2 = err2;
          if (e2?.stdout) console.error('[resume-cli fallback stdout]', e2.stdout);
          if (e2?.stderr) console.error('[resume-cli fallback stderr]', e2.stderr);
          throw error;
        }
        const pdfBuffer = await readFile(pdfFile);
        return pdfBuffer;
      } catch (e) {
        throw error;
      }
    }
    throw error;
  } finally {
    // Best-effort cleanup
    try { await unlink(resumeFile); } catch {}
    try { await unlink(pdfFile); } catch {}
  }
}

