# NeuroBloom — Social Skills Web App

A web-based social skills training tool for the FSI Autism Hackathon 2026.

## Features

- **Dashboard** — Overview of social skill modules and progress
- **Scenario Constructor** — AI-powered tool to generate and interact with customizable 3D social scenarios
  - Describe a social situation in text or voice
  - Gemini AI generates a character with personality, clothing, and mood
  - Procedural Three.js cafeteria scene rendered in-browser
  - Talk to the generated character in a context-aware role-play chat

## Tech Stack

- Node.js / Express static server
- Google Gemini API (`gemini-2.5-flash`) for scenario generation and character chat
- Three.js (CDN ESM) for 3D scene rendering
- Firebase Authentication
- Deployed on Vercel: **https://neurobloom-sooty.vercel.app**

## Setup

```bash
npm install
```

Create a `.env` file:
```
GEMINI_API_KEY=your_key_here
```

Run locally:
```bash
npm start
```

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Model override (default: `gemini-2.5-flash`) |
