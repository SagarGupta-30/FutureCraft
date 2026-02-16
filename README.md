# SkillSprint - AI Career Roadmap Builder for Students

SkillSprint is a full-stack AI web application that generates personalized student career roadmaps.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- AI: OpenAI API

## Project Structure

```
.
├── client/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js
│   │   └── roadmap.js
│   ├── dashboard.html
│   ├── index.html
│   └── roadmap.html
├── server/
│   ├── controllers/
│   │   └── roadmapController.js
│   ├── routes/
│   │   └── roadmapRoutes.js
│   ├── services/
│   │   └── openaiService.js
│   └── index.js
├── .env
├── .env.example
├── package.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

3. Run development server:

```bash
npm run dev
```

4. Open app:

```text
http://localhost:5000
```

## If You Use Live Server (Optional)

- Keep backend running on `http://localhost:5000` with `npm run dev`.
- Open `client/index.html` using Live Server.
- Frontend is configured to call `http://localhost:5000/api/roadmap` automatically in this mode.

## Main Features

- Landing page with app intro and call-to-action
- Dashboard form for student profile input
- AI-generated roadmap with structured sections:
  - Skills to Learn
  - Projects to Build
  - Certifications
  - Interview Preparation Plan
  - 6-Month Timeline
- Loading animation while roadmap is being generated
- Static progress tracker UI
- PDF download for roadmap
- API error handling and input validation

## API Endpoint

### `POST /api/roadmap`

Request body:

```json
{
  "name": "Alice",
  "branch": "Computer Science",
  "year": "3rd Year",
  "targetRole": "Software Engineer",
  "targetCompany": "Google",
  "currentSkills": "JavaScript, React, DSA",
  "experienceLevel": "Intermediate"
}
```

Response:

```json
{
  "success": true,
  "roadmap": {
    "skills": [],
    "projects": [],
    "certifications": [],
    "interview_prep": [],
    "timeline": []
  }
}
```
