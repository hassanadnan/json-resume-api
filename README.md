# JSON Resume API

A REST API service for generating resumes in PDF and HTML formats using the [JSON Resume](https://jsonresume.org/) standard.

## Features

- Generate resumes from JSON Resume format
- Export to PDF (via resume-cli)
- Optional HTML preview (if enabled)
- Support for JSON Resume themes (via resume-cli)
- Validates against JSON Resume schema
- Railway-ready deployment

## JSON Resume Schema

This API uses the official [JSON Resume schema](https://docs.jsonresume.org/schema). All resumes must follow this format.

## API Endpoints

### POST `/api/resume/generate`

Generates a resume PDF from JSON Resume data.

**Request Body:** JSON Resume format (see [schema documentation](https://docs.jsonresume.org/schema)) or an object with `resume` and optional `theme`:

```json
{
  "resume": { "... JSON Resume ..." },
  "theme": "professional"
}
```

Alternatively, pass the theme via query: `POST /api/resume/generate?theme=professional`

**Response:** PDF file (application/pdf)

> Note: Theme packages may need to be installed when using non-default themes with resume-cli.

<!-- Optional HTML endpoint (disabled by default) -->
<!--
### POST `/api/resume/html`

Generates an HTML preview of the resume.

**Request Body:** JSON Resume format

**Response:** HTML page
-->

### POST `/api/resume/validate`

Validates JSON Resume data against the schema.

**Request Body:** JSON Resume format

**Response:** Validation result

### GET `/health`

Health check endpoint.

## Local Development

```bash
npm install
npm start
```

## Example Usage

### Generate PDF (default theme)

```bash
curl -X POST http://localhost:3000/api/resume/generate \
  -H "Content-Type: application/json" \
  -d @sample-request.json \
  --output resume.pdf
```

### Generate PDF with theme

```bash
curl -X POST "http://localhost:3000/api/resume/generate?theme=professional" \
  -H "Content-Type: application/json" \
  -d @sample-request.json \
  --output resume.pdf
```

## Railway Deployment

1. Create a new Railway project
2. Connect your GitHub repository
3. Railway will automatically detect and deploy

This repo includes a `railway.json` with sensible defaults. No extra setup is required.

## Example Request

```json
{
  "basics": {
    "name": "John Doe",
    "label": "Software Engineer",
    "email": "john@example.com",
    "phone": "(912) 555-4321",
    "url": "https://johndoe.com",
    "summary": "Experienced software engineer..."
  },
  "work": [
    {
      "name": "Company",
      "position": "Senior Engineer",
      "url": "https://company.com",
      "startDate": "2020-01",
      "endDate": "",
      "summary": "Led team of engineers...",
      "highlights": [
        "Built scalable API serving 1M+ requests/day",
        "Reduced deployment time by 60%"
      ]
    }
  ],
  "education": [
    {
      "institution": "University",
      "area": "Computer Science",
      "studyType": "Bachelor",
      "startDate": "2016-09",
      "endDate": "2020-06"
    }
  ]
}
```

## Resources

- [JSON Resume Schema Documentation](https://docs.jsonresume.org/schema)
- [JSON Resume GitHub](https://github.com/jsonresume)
- [Available Themes](https://jsonresume.org/themes)

