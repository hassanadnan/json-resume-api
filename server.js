import express from 'express';
import cors from 'cors';
import { validateResume } from './utils/validator.js';
import { generatePDF } from './services/pdfGenerator.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'json-resume-api',
    version: '1.0.0',
  });
});

// Generate PDF from JSON Resume
app.post('/api/resume/generate', async (req, res) => {
  try {
    const resumeData = req.body?.resume || req.body;
    const theme = req.query?.theme || req.body?.theme;

    // Validate resume data
    const validation = validateResume(resumeData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid JSON Resume data',
        details: validation.errors,
      });
    }

    // Generate PDF via resume-cli
    const pdfBuffer = await generatePDF(resumeData, theme);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="resume-${Date.now()}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating resume:', error);
    // Bubble up stderr/stdout if present (from child_process.exec errors)
    const stderr = error?.stderr ? String(error.stderr).slice(0, 4000) : undefined;
    const stdout = error?.stdout ? String(error.stdout).slice(0, 2000) : undefined;
    res.status(500).json({
      error: 'Failed to generate resume',
      message: error?.message || 'Unknown error',
      stderr,
      stdout,
    });
  }
});

// Validate JSON Resume
app.post('/api/resume/validate', (req, res) => {
  try {
    const resumeData = req.body?.resume || req.body;
    const validation = validateResume(resumeData);

    res.json({
      valid: validation.valid,
      errors: validation.errors || [],
    });
  } catch (error) {
    console.error('Error validating resume:', error);
    res.status(500).json({
      error: 'Validation failed',
      message: error.message,
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JSON Resume API listening on port ${PORT}`);
});

