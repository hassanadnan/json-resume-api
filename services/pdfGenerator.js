// PDF generator using resume-cli (no Puppeteer)
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

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

    // Build command
    const themeArg = theme ? ` --theme ${theme}` : '';
    const cmd = `${resumeCli} export "${pdfFile}"${themeArg} --resume "${resumeFile}"`;

    // Execute resume-cli to export PDF
    await execAsync(cmd, { env: { ...process.env, NO_COLOR: '1' } });

    // Read generated PDF
    const pdfBuffer = await readFile(pdfFile);

    return pdfBuffer;
  } catch (error) {
    // If a theme is missing, retry once without theme to use CLI default
    if (theme) {
      try {
        const fallbackCmd = `${resumeCli} export "${pdfFile}" --resume "${resumeFile}"`;
        await execAsync(fallbackCmd, { env: { ...process.env, NO_COLOR: '1' } });
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

