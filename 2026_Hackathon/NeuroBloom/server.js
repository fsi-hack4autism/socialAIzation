'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const geminiReady = GEMINI_KEY && GEMINI_KEY !== 'YOUR_KEY_HERE';

let ai = null;
if (geminiReady) {
  ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
}

const FIREBASE_DB_URL = process.env.FIREBASE_DATABASE_URL ||
  'https://fsihackathon-fadc2-default-rtdb.firebaseio.com';

const firebaseReady = true; // always try — use JSON file locally, env vars on Vercel

let db = null;

if (firebaseReady) {
  try {
    if (!admin.apps.length) {
      // Prefer service account JSON file if present (local dev)
      const SA_PATH = path.join(__dirname, 'fsihackathon-fadc2-firebase-adminsdk-fbsvc-6765b35f1b.json');
      let credential;
      try {
        credential = admin.credential.cert(require(SA_PATH));
      } catch (_) {
        // Vercel: fall back to individual env vars
        credential = admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        });
      }
      admin.initializeApp({ credential, databaseURL: FIREBASE_DB_URL });
    }
    db = admin.database();
  } catch (e) {
    console.error('Firebase init failed:', e.message);
  }
}

const SKILL_FIELDS = [
  'topicAdherence',
  'turnTaking',
  'questionAsking',
  'emotionalAcknowledgment',
  'conversationInitiation',
  'responseRelevance',
];

const VALID_MOODS = new Set(['happy', 'calm', 'tired', 'proud', 'excited']);

const SCENARIO_NAMES = {
  classroom: 'a school classroom discussion',
  grocery: 'a grocery store interaction',
  grocery_store: 'a grocery store interaction',
  job_interview: 'a job interview',
  playground: 'a playground social scenario',
  restaurant: 'a restaurant visit',
  bus_stop: 'a bus stop conversation',
  general: 'a general social interaction',
};

const SCENARIO_COLORS = [
  '#4E8A67',
  '#C4715E',
  '#C9963A',
  '#8B7EC4',
  '#355C4A',
  '#7A4E3E',
  '#2F4858',
  '#E9D8A6',
  '#F4A261',
  '#6D6875',
];

const SCENARIO_ENUMS = {
  ageGroup: new Set(['child', 'teen', 'young_adult', 'adult']),
  gender: new Set(['female', 'male', 'nonbinary', 'unspecified']),
  expression: new Set(['neutral', 'happy', 'anxious', 'angry', 'sad', 'confident', 'confused']),
  posture: new Set(['standing', 'relaxed', 'tense', 'slouched', 'open']),
  ambientMood: new Set(['calm', 'busy', 'tense', 'friendly', 'focused']),
  propType: new Set(['tray', 'backpack', 'notebook', 'poster', 'lunch', 'drink', 'book']),
};

const scenarioRateLimit = new Map();

function emptyAverageScores() {
  return {
    topicAdherence: 0,
    turnTaking: 0,
    questionAsking: 0,
    emotionalAcknowledgment: 0,
    conversationInitiation: 0,
    responseRelevance: 0,
  };
}

function createInitialState(playerName = null) {
  return {
    playerName,
    playerLevel: 1,
    totalSessions: 0,
    streakDays: 0,
    overallScore: null,
    totalAchievements: 0,
    sessions: [],
    latestSession: null,
    achievements: [],
    skillsHistory: [],
    analyzing: false,
    lastUpdated: null,
    averageScores: emptyAverageScores(),
  };
}

let state = createInitialState();
const memoryPlayers = new Map();

function buildPrompt(transcript, scenario) {
  const transcriptText = Array.isArray(transcript)
    ? transcript.map(t => `${t.speaker || 'Speaker'}: ${t.text}`).join('\n')
    : String(transcript);

  const scenarioDesc = SCENARIO_NAMES[scenario?.type] || 'a social interaction';
  const difficulty = scenario?.difficulty || 1;

  return `You are a warm, expert autism support coach reviewing a VR social-skills training session.

Scenario: ${scenarioDesc} (difficulty ${difficulty}/5)

Analyze the transcript below and return ONLY a single valid JSON object — no extra text, no markdown.

JSON structure to return:
{
  "scores": {
    "overallScore":              <integer 0-100>,
    "topicAdherence":            <integer 0-100  — did the player stay on topic and follow the conversation flow?>,
    "turnTaking":                <integer 0-100  — did the player allow others to speak without interrupting?>,
    "questionAsking":            <integer 0-100  — did the player ask relevant, curious questions?>,
    "emotionalAcknowledgment":   <integer 0-100  — did the player notice and respond to emotional cues in what others said?>,
    "conversationInitiation":    <integer 0-100  — did the player start topics, re-engage, and keep conversation going?>,
    "responseRelevance":         <integer 0-100  — were the player's responses directly relevant to what was said?>
  },
  "highlights":    [<2-4 specific, encouraging sentences that reference actual moments in the transcript>],
  "improvements":  [<1-3 gentle, constructive suggestions — always kind, never critical>],
  "starsEarned":   <integer 1-5>,
  "moodAfter":     <one of exactly: "happy", "calm", "tired", "proud", "excited">,
  "achievements":  [<zero or more from this exact list: "topic_champion", "great_listener", "question_master", "empathy_star", "conversation_starter", "response_ace", "perfect_score">],
  "summary":       <one warm sentence summarising what the player did well overall>
}

Award an achievement only when the matching score is 85 or above:
  topic_champion      → topicAdherence ≥ 85
  great_listener      → turnTaking ≥ 85
  question_master     → questionAsking ≥ 85
  empathy_star        → emotionalAcknowledgment ≥ 85
  conversation_starter→ conversationInitiation ≥ 85
  response_ace        → responseRelevance ≥ 85
  perfect_score       → overallScore ≥ 90

Be specific and reference actual words or moments from the transcript in your highlights.

TRANSCRIPT:
${transcriptText}`;
}

async function analyzeTranscript(transcript, scenario) {
  if (!geminiReady) {
    throw new Error('GEMINI_API_KEY not configured. Open .env and paste your key.');
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: buildPrompt(transcript, scenario),
    config: { responseMimeType: 'application/json' },
  });
  const text = response.text.trim();

  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(clean);

  const baseScores = {
    overallScore: 0,
    ...emptyAverageScores(),
    ...(parsed.scores || {}),
  };

  Object.keys(baseScores).forEach(k => {
    baseScores[k] = Math.max(0, Math.min(100, Math.round(baseScores[k] ?? 0)));
  });

  parsed.scores = baseScores;
  return parsed;
}

function sanitizePlayerKey(playerName) {
  return String(playerName || 'guest')
    .trim()
    .toLowerCase()
    .replace(/[.#$/\[\]]/g, '_')
    .replace(/\s+/g, '-');
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeStringArray(value, limit) {
  return toArray(value)
    .map(item => String(item).trim())
    .filter(Boolean)
    .slice(0, limit);
}

function safeShortString(value, fallback = '', maxLength = 160) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : fallback;
}

function safeEnum(value, allowed, fallback) {
  const key = String(value || '').trim().toLowerCase();
  return allowed.has(key) ? key : fallback;
}

function randomScenarioColor(offset = 0) {
  return SCENARIO_COLORS[(Date.now() + offset) % SCENARIO_COLORS.length];
}

function safeHexColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toUpperCase() : fallback;
}

function checkScenarioRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 8;
  const key = String(ip || 'unknown');
  const recent = (scenarioRateLimit.get(key) || []).filter(time => now - time < windowMs);
  if (recent.length >= limit) {
    scenarioRateLimit.set(key, recent);
    return false;
  }
  recent.push(now);
  scenarioRateLimit.set(key, recent);
  return true;
}

function sanitizeScenarioJson(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const character = source.character && typeof source.character === 'object' ? source.character : {};

  const props = toArray(source.props)
    .filter(item => item && typeof item === 'object')
    .slice(0, 6)
    .map((item, index) => ({
      type: safeEnum(item.type, SCENARIO_ENUMS.propType, ['tray', 'backpack', 'notebook', 'poster', 'lunch', 'drink'][index % 6]),
      color: safeHexColor(item.color, randomScenarioColor(index + 5)),
      label: safeShortString(item.label, '', 36),
    }));

  const dialogueBubbles = toArray(source.dialogueBubbles)
    .filter(item => item && typeof item === 'object')
    .slice(0, 4)
    .map(item => ({
      speaker: safeShortString(item.speaker, 'Scenario character', 36),
      text: safeShortString(item.text, 'I need a moment to explain how I feel.', 140),
      tone: safeShortString(item.tone, 'spoken thought', 36),
    }))
    .filter(item => item.text);

  return {
    title: safeShortString(source.title, 'Cafeteria Social Moment', 80),
    setting: 'cafeteria',
    ambientMood: safeEnum(source.ambientMood, SCENARIO_ENUMS.ambientMood, 'focused'),
    guidance: safeShortString(source.guidance, 'Notice the character’s emotion and practice a calm first response.', 220),
    character: {
      name: safeShortString(character.name, 'Jordan', 36),
      role: safeShortString(character.role, 'student in the cafeteria', 64),
      ageGroup: safeEnum(character.ageGroup, SCENARIO_ENUMS.ageGroup, 'teen'),
      gender: safeEnum(character.gender, SCENARIO_ENUMS.gender, 'unspecified'),
      personality: safeShortString(character.personality, 'expressive but still reachable', 90),
      shirtColor: safeHexColor(character.shirtColor, randomScenarioColor(1)),
      pantsColor: safeHexColor(character.pantsColor, randomScenarioColor(2)),
      hairColor: safeHexColor(character.hairColor, '#4A2D20'),
      skinTone: safeHexColor(character.skinTone, '#B9825A'),
      expression: safeEnum(character.expression, SCENARIO_ENUMS.expression, 'neutral'),
      posture: safeEnum(character.posture, SCENARIO_ENUMS.posture, 'standing'),
    },
    props,
    dialogueBubbles: dialogueBubbles.length ? dialogueBubbles : [
      {
        speaker: safeShortString(character.name, 'Jordan', 36),
        text: 'I am trying to say what happened, but I feel overwhelmed.',
        tone: 'honest',
      },
    ],
  };
}

function parseGeminiJson(text) {
  const clean = String(text || '').trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  return JSON.parse(clean);
}

function buildScenarioConstructorPrompt(message, currentScene, history) {
  return `You are the NeuroBloom Scenario Constructor for autism social-skills practice.

Return ONLY one valid JSON object. No markdown, no prose, no comments.

Generate a cafeteria-based 3D social scenario from the user's request. Keep it supportive, classroom-safe, and age-appropriate. The base setting is always a school cafeteria with one visible person standing in the room.

Important constraints:
- Do not include action instructions, hidden actions, animation steps, code, HTML, URLs, or markdown.
- Dialogue bubbles must contain only short spoken lines, visible thoughts, or emotion labels that can appear in the browser as text bubbles.
- Clothing colors may be randomized when the user does not specify them.
- Do not stereotype demographics. Use neutral defaults unless the user explicitly requests a harmless visible trait.
- Use hex colors like "#C4715E" for every color field.
- Keep all strings short.

JSON shape:
{
  "title": "short scenario title",
  "setting": "cafeteria",
  "ambientMood": "calm|busy|tense|friendly|focused",
  "guidance": "one short coaching cue for the learner",
  "character": {
    "name": "short name",
    "role": "short role",
    "ageGroup": "child|teen|young_adult|adult",
    "gender": "female|male|nonbinary|unspecified",
    "personality": "short personality description with no actions",
    "shirtColor": "#RRGGBB",
    "pantsColor": "#RRGGBB",
    "hairColor": "#RRGGBB",
    "skinTone": "#RRGGBB",
    "expression": "neutral|happy|anxious|angry|sad|confident|confused",
    "posture": "standing|relaxed|tense|slouched|open"
  },
  "props": [
    { "type": "tray|backpack|notebook|poster|lunch|drink|book", "color": "#RRGGBB", "label": "short optional label" }
  ],
  "dialogueBubbles": [
    { "speaker": "character name", "text": "short visible bubble text", "tone": "short tone" }
  ]
}

Previous scene JSON, if the user is editing an existing scene:
${JSON.stringify(currentScene || null).slice(0, 3000)}

Recent chat context:
${JSON.stringify(toArray(history).slice(-6), null, 2).slice(0, 2500)}

User request:
${String(message).trim()}`;
}

function sanitizeCharacterReplyJson(raw, scenario) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const character = scenario?.character || {};
  return {
    speaker: safeShortString(source.speaker, character.name || 'Scenario character', 36),
    reply: safeShortString(source.reply, 'I am listening. Can you say that another way?', 420),
    tone: safeShortString(source.tone, 'in character', 42),
    expression: safeEnum(source.expression, SCENARIO_ENUMS.expression, character.expression || 'neutral'),
  };
}

function buildScenarioCharacterPrompt(message, scenario, discussionHistory) {
  const safeScenario = sanitizeScenarioJson(scenario || {});
  const character = safeScenario.character;

  return `You are role-playing as the generated NeuroBloom cafeteria scenario character.

Return ONLY one valid JSON object. No markdown, no prose outside JSON.

Stay in character as:
${JSON.stringify(character, null, 2)}

Scene context:
${JSON.stringify({
  title: safeScenario.title,
  setting: safeScenario.setting,
  ambientMood: safeScenario.ambientMood,
  guidance: safeScenario.guidance,
  props: safeScenario.props,
  visibleBubbles: safeScenario.dialogueBubbles,
}, null, 2)}

Rules:
- Speak as the character, not as Gemini, not as a therapist, and not as an app narrator.
- Use the current cafeteria situation and the full discussion history so your reply is context-aware.
- Keep the reply natural and short: 1 to 3 sentences.
- Show personality through words only. Do not include hidden actions, stage directions, code, HTML, markdown, or instructions.
- Keep it age-appropriate and safe for social-skills practice.
- If the user asks to edit the scene instead of talking, briefly answer in character and suggest using the scene builder.

JSON shape:
{
  "speaker": "${character.name}",
  "reply": "the character's spoken response",
  "tone": "short tone label",
  "expression": "neutral|happy|anxious|angry|sad|confident|confused"
}

Discussion history:
${JSON.stringify(toArray(discussionHistory).slice(-10), null, 2).slice(0, 4500)}

Learner message:
${String(message).trim()}`;
}

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getMemoryState(playerName) {
  const key = sanitizePlayerKey(playerName || 'default');
  if (!memoryPlayers.has(key)) {
    memoryPlayers.set(key, createInitialState(playerName || null));
  }
  const memoryState = memoryPlayers.get(key);
  if (playerName && !memoryState.playerName) {
    memoryState.playerName = playerName;
  }
  return memoryState;
}

function syncLegacyState(nextState) {
  state = JSON.parse(JSON.stringify(nextState));
  return state;
}

function sortSessions(sessions) {
  return [...toArray(sessions)].sort((a, b) => {
    const left = new Date(a.timestamp || a.processedAt || 0).getTime();
    const right = new Date(b.timestamp || b.processedAt || 0).getTime();
    return left - right;
  });
}

function computeAverageScoresFromSessions(sessions) {
  const ordered = sortSessions(sessions);
  if (!ordered.length) {
    return emptyAverageScores();
  }
  const sums = emptyAverageScores();
  ordered.forEach(session => {
    SKILL_FIELDS.forEach(field => {
      sums[field] += parseNumber(session?.scores?.[field], 0) || 0;
    });
  });
  const averages = emptyAverageScores();
  SKILL_FIELDS.forEach(field => {
    averages[field] = Math.round(sums[field] / ordered.length);
  });
  return averages;
}

function appendSkillsHistory(existingHistory, session) {
  const history = toArray(existingHistory)
    .filter(entry => entry && typeof entry === 'object')
    .slice(-19);
  history.push({
    label: `#${session.sessionNumber}`,
    timestamp: session.timestamp,
    overallScore: parseNumber(session?.scores?.overallScore, 0) || 0,
  });
  return history;
}

function deriveStreakDays(currentStats, submittedStreak, now) {
  const explicit = parseNumber(submittedStreak, null);
  if (explicit != null) {
    return Math.max(0, Math.round(explicit));
  }

  const current = Math.max(0, parseNumber(currentStats?.streakDays, 0) || 0);
  const lastUpdated = currentStats?.lastUpdated ? new Date(currentStats.lastUpdated) : null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (!lastUpdated || Number.isNaN(lastUpdated.getTime())) {
    return 1;
  }

  const previous = new Date(lastUpdated);
  previous.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - previous) / 86400000);

  if (diffDays <= 0) return Math.max(current, 1);
  if (diffDays === 1) return current + 1;
  return 1;
}

function mergeAchievements(existingAchievements, sessionAchievements, streakDays, sessionNumber) {
  const merged = new Set([
    ...toArray(existingAchievements),
    ...toArray(sessionAchievements),
  ]);

  if (sessionNumber === 1) merged.add('first_session');
  if (streakDays >= 3) merged.add('streak_3');
  if (streakDays >= 7) merged.add('streak_7');

  return [...merged];
}

function calculateRollingAverages(currentStats, session) {
  const currentCount = Math.max(0, parseNumber(currentStats?.totalSessions, 0) || 0);
  const next = emptyAverageScores();

  SKILL_FIELDS.forEach(field => {
    const priorAverage = parseNumber(currentStats?.averageScores?.[field], 0) || 0;
    const currentScore = parseNumber(session?.scores?.[field], 0) || 0;
    next[field] = Math.round(((priorAverage * currentCount) + currentScore) / (currentCount + 1));
  });

  return next;
}

function normalisePlayerRecord(playerName, record) {
  if (!record || typeof record !== 'object' || !record.stats) {
    return createInitialState(playerName || null);
  }

  const sessions = sortSessions(Object.values(record.sessions || {}));
  const latestSession = record.latestSession || sessions.at(-1) || null;
  const stats = record.stats || {};

  return {
    playerName: stats.playerName || latestSession?.playerName || playerName || null,
    playerLevel: parseNumber(stats.playerLevel, 1) || 1,
    totalSessions: parseNumber(stats.totalSessions, sessions.length) || 0,
    streakDays: parseNumber(stats.streakDays, 0) || 0,
    overallScore: stats.overallScore ?? latestSession?.scores?.overallScore ?? null,
    totalAchievements: parseNumber(stats.totalAchievements, toArray(stats.achievements).length) || 0,
    sessions,
    latestSession,
    achievements: toArray(stats.achievements),
    skillsHistory: toArray(stats.skillsHistory),
    analyzing: !!stats.analyzing,
    lastUpdated: stats.lastUpdated || latestSession?.processedAt || latestSession?.timestamp || null,
    averageScores: {
      ...emptyAverageScores(),
      ...(stats.averageScores || computeAverageScoresFromSessions(sessions)),
    },
  };
}

async function readFirebasePlayer(playerName) {
  const playerKey = sanitizePlayerKey(playerName);
  const snap = await db.ref(`players/${playerKey}`).once('value');
  return snap.val() || null;
}

function serialiseRecentSessions(sessions, limit = 6) {
  return sortSessions(sessions)
    .slice(-limit)
    .map(session => ({
      when: session.timestamp,
      scenario: session?.scenario?.type || 'general',
      score: session?.scores?.overallScore ?? null,
      mood: session?.moodAfter || null,
      summary: session?.summary || '',
      highlights: safeStringArray(session?.highlights, 2),
      improvements: safeStringArray(session?.improvements, 2),
    }));
}

async function generateText(prompt) {
  if (!geminiReady) {
    throw new Error('GEMINI_API_KEY not configured. Open .env and paste your key.');
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return response.text.trim();
}

app.get('/api/firebase-config', (_req, res) => {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAXmYb4nCwWx7jMb9EodwKCjXXzGSi44BE';
  res.json({
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fsihackathon-fadc2.firebaseapp.com',
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://fsihackathon-fadc2-default-rtdb.firebaseio.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fsihackathon-fadc2',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '908066829273',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:908066829273:web:2e6bc2787f391ae9775fc8',
    configured: true,
  });
});

app.get('/scenario-constructor', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scenario-constructor.html'));
});

app.post('/api/input-results', async (req, res) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Bad Request', message: 'Body must be a JSON object.' });
  }

  for (const field of ['playerName', 'transcript', 'scenario']) {
    if (body[field] == null || body[field] === '') {
      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: `Missing required field: \`${field}\``,
        field,
      });
    }
  }

  if (!geminiReady) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'GEMINI_API_KEY not configured. Open .env and paste your key.',
      hint: 'Get a free key at https://aistudio.google.com/apikey then restart the server.',
    });
  }

  const now = new Date().toISOString();
  const playerName = String(body.playerName).trim();
  const playerKey = sanitizePlayerKey(playerName);
  const firebaseActive = !!db;

  let currentStats = createInitialState(playerName);

  try {
    if (firebaseActive) {
      const statsSnap = await db.ref(`players/${playerKey}/stats`).once('value');
      currentStats = {
        ...createInitialState(playerName),
        ...(statsSnap.val() || {}),
        playerName,
      };

      await db.ref(`players/${playerKey}/stats`).set({
        ...currentStats,
        playerName,
        analyzing: true,
      });
    } else {
      currentStats = getMemoryState(playerName);
      currentStats.playerName = playerName;
      currentStats.analyzing = true;
      syncLegacyState(currentStats);
    }

    const analysis = await analyzeTranscript(body.transcript, body.scenario);
    const sessionNumber = (parseNumber(currentStats.totalSessions, 0) || 0) + 1;
    const totalSessions = Math.max(sessionNumber, parseNumber(body.totalSessions, sessionNumber));
    const streakDays = deriveStreakDays(currentStats, body.streakDays, now);

    const session = {
      id: typeof body.sessionId === 'string' && body.sessionId.trim()
        ? body.sessionId.trim()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionNumber,
      timestamp: typeof body.timestamp === 'string' ? body.timestamp : now,
      playerName,
      scenario: {
        type: body.scenario?.type || 'general',
        difficulty: parseNumber(body.scenario?.difficulty, 1),
        durationMinutes: parseNumber(body.scenario?.durationMinutes, 0),
        location: body.scenario?.location || null,
      },
      transcript: body.transcript,
      scores: analysis.scores || {},
      highlights: safeStringArray(analysis.highlights, 4),
      improvements: safeStringArray(analysis.improvements, 3),
      starsEarned: Math.max(0, Math.min(5, Math.round(parseNumber(analysis.starsEarned, 0) || 0))),
      moodAfter: VALID_MOODS.has(analysis.moodAfter) ? analysis.moodAfter : null,
      summary: typeof analysis.summary === 'string' ? analysis.summary.trim() : '',
      achievements: safeStringArray(analysis.achievements, 12),
      processedAt: now,
    };

    session.achievements = mergeAchievements(
      currentStats.achievements,
      session.achievements,
      streakDays,
      sessionNumber,
    );

    const newAchievements = session.achievements.filter(id => !toArray(currentStats.achievements).includes(id));

    const statsUpdate = {
      playerName,
      totalSessions,
      streakDays,
      overallScore: session.scores.overallScore ?? null,
      playerLevel: Math.floor(totalSessions / 5) + 1,
      totalAchievements: session.achievements.length,
      averageScores: calculateRollingAverages(currentStats, session),
      achievements: session.achievements,
      skillsHistory: appendSkillsHistory(currentStats.skillsHistory, session),
      analyzing: false,
      lastUpdated: now,
    };

    if (firebaseActive) {
      await Promise.all([
        db.ref(`players/${playerKey}/sessions/${session.id}`).set(session),
        db.ref(`players/${playerKey}/latestSession`).set(session),
        db.ref(`players/${playerKey}/stats`).set(statsUpdate),
      ]);
    } else {
      const memoryState = getMemoryState(playerName);
      memoryState.playerName = playerName;
      memoryState.analyzing = false;
      memoryState.sessions.push(session);
      memoryState.latestSession = session;
      memoryState.totalSessions = totalSessions;
      memoryState.streakDays = streakDays;
      memoryState.overallScore = statsUpdate.overallScore;
      memoryState.playerLevel = statsUpdate.playerLevel;
      memoryState.achievements = session.achievements;
      memoryState.totalAchievements = session.achievements.length;
      memoryState.skillsHistory = statsUpdate.skillsHistory;
      memoryState.averageScores = statsUpdate.averageScores;
      memoryState.lastUpdated = now;
      syncLegacyState(memoryState);
    }

    return res.status(201).json({
      success: true,
      requestId: `req-${Date.now()}`,
      message: 'Transcript analysed and player state updated.',
      sessionId: session.id,
      sessionNumber: session.sessionNumber,
      processedAt: session.processedAt,
      newAchievements,
      analysis: {
        scores: session.scores,
        highlights: session.highlights,
        improvements: session.improvements,
        starsEarned: session.starsEarned,
        moodAfter: session.moodAfter,
        summary: session.summary,
        achievements: session.achievements,
      },
      session,
      stats: statsUpdate,
    });
  } catch (err) {
    if (firebaseActive) {
      try {
        await db.ref(`players/${playerKey}/stats/analyzing`).set(false);
      } catch (_) {}
    } else {
      const memoryState = getMemoryState(playerName);
      memoryState.analyzing = false;
      syncLegacyState(memoryState);
    }

    const isKeyError = /api.?key|auth|permission|403|401/i.test(err.message);
    return res.status(isKeyError ? 401 : 502).json({
      error: isKeyError ? 'Unauthorized' : 'Analysis Failed',
      message: err.message,
      hint: isKeyError
        ? 'Check your GEMINI_API_KEY in .env'
        : 'Gemini could not process the transcript. Check server logs.',
    });
  }
});

app.post('/api/coach-chat', async (req, res) => {
  const { playerName, message, sessionHistory, personalization } = req.body || {};

  if (!playerName || !message) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'playerName and message are required.',
    });
  }

  try {
    const firebaseActive = !!db;
    let stats = createInitialState(playerName);
    let sessions = [];

    if (firebaseActive) {
      const player = await readFirebasePlayer(playerName);
      const normalised = normalisePlayerRecord(playerName, player);
      stats = normalised;
      sessions = normalised.sessions;
    } else {
      const memoryState = getMemoryState(playerName);
      stats = memoryState;
      sessions = memoryState.sessions;
    }

    const profile = {
      preferredName: String(personalization?.preferredName || '').trim(),
      supportStyle: String(personalization?.supportStyle || 'gentle').trim(),
      interests: String(personalization?.interests || '').trim(),
      affirmation: String(personalization?.affirmation || '').trim(),
    };

    const prompt = `You are Coach Aria, a warm and encouraging autism-support coach for NeuroBloom.

Speak directly to ${profile.preferredName || playerName}. Be kind, concrete, and encouraging. Keep the reply between 80 and 140 words. Avoid medical claims, avoid overpraising, and give 1-2 practical next steps.

Personalization profile (adapt tone and examples to this):
${JSON.stringify(profile, null, 2)}

Use inclusive, strengths-first language. Start by acknowledging one specific strength before suggesting a next step.

Player summary:
${JSON.stringify({
  totalSessions: stats.totalSessions,
  streakDays: stats.streakDays,
  overallScore: stats.overallScore,
  achievements: stats.achievements,
  averageScores: stats.averageScores,
  latestSession: stats.latestSession
    ? {
        scenario: stats.latestSession.scenario,
        score: stats.latestSession.scores?.overallScore,
        moodAfter: stats.latestSession.moodAfter,
        summary: stats.latestSession.summary,
      }
    : null,
}, null, 2)}

Recent session history:
${JSON.stringify(serialiseRecentSessions(sessions, 5), null, 2)}

Optional UI context:
${JSON.stringify(toArray(sessionHistory).slice(-5), null, 2)}

Player message:
${String(message).trim()}

Reply with plain text only.`;

    const reply = await generateText(prompt);
    return res.json({ reply });
  } catch (err) {
    const isKeyError = /api.?key|auth|permission|403|401/i.test(err.message);
    return res.status(isKeyError ? 401 : 502).json({
      error: isKeyError ? 'Unauthorized' : 'Coach Chat Failed',
      message: err.message,
    });
  }
});

app.post('/api/generate-report', async (req, res) => {
  const { playerName } = req.body || {};

  if (!playerName) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'playerName is required.',
    });
  }

  try {
    const firebaseActive = !!db;
    let stats = createInitialState(playerName);
    let sessions = [];

    if (firebaseActive) {
      const player = await readFirebasePlayer(playerName);
      const normalised = normalisePlayerRecord(playerName, player);
      stats = normalised;
      sessions = normalised.sessions;
    } else {
      const memoryState = getMemoryState(playerName);
      stats = memoryState;
      sessions = memoryState.sessions;
    }

    if (!sessions.length) {
      return res.json({
        report: `${playerName} is ready to begin their NeuroBloom journey. Once a few sessions have been completed, this report will turn those conversations into a warm summary of strengths, growth patterns, and gentle next steps for home or therapy support.`,
      });
    }

    const prompt = `Write a warm, plain-English progress report for a parent or therapist about ${playerName}'s VR social-skills practice.

Requirements:
- Use a hopeful, grounded tone.
- Keep it under 400 words.
- Avoid jargon and clinical language.
- Include four short sections with these headings exactly:
  Overall progress
  Strengths we're seeing
  Skills to keep practicing
  Gentle next step
- Be specific about progress patterns, recent wins, and one practical suggestion.
- Do not invent diagnoses, risks, or medical recommendations.

Player stats:
${JSON.stringify({
  totalSessions: stats.totalSessions,
  streakDays: stats.streakDays,
  overallScore: stats.overallScore,
  achievements: stats.achievements,
  averageScores: stats.averageScores,
}, null, 2)}

Recent sessions:
${JSON.stringify(serialiseRecentSessions(sessions, 8), null, 2)}

Return plain text only.`;

    const report = await generateText(prompt);
    return res.json({ report });
  } catch (err) {
    const isKeyError = /api.?key|auth|permission|403|401/i.test(err.message);
    return res.status(isKeyError ? 401 : 502).json({
      error: isKeyError ? 'Unauthorized' : 'Report Generation Failed',
      message: err.message,
    });
  }
});

app.post('/api/scenario-constructor', async (req, res) => {
  const { message, currentScene, history } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'message is required.',
    });
  }

  if (!checkScenarioRateLimit(req.ip)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please wait a moment before generating another scenario.',
    });
  }

  if (!geminiReady) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'GEMINI_API_KEY not configured. Open .env and paste your key.',
      hint: 'Get a free key at https://aistudio.google.com/apikey then restart the server.',
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildScenarioConstructorPrompt(message, currentScene, history),
      config: { responseMimeType: 'application/json' },
    });
    const scenario = sanitizeScenarioJson(parseGeminiJson(response.text));

    return res.json({
      success: true,
      requestId: `scenario-${Date.now()}`,
      scenario,
    });
  } catch (err) {
    const isKeyError = /api.?key|auth|permission|403|401/i.test(err.message);
    return res.status(isKeyError ? 401 : 502).json({
      error: isKeyError ? 'Unauthorized' : 'Scenario Generation Failed',
      message: err.message,
      hint: isKeyError
        ? 'Check your GEMINI_API_KEY in .env'
        : 'Gemini could not produce a valid scene JSON. Try a simpler scenario prompt.',
    });
  }
});

app.post('/api/scenario-character-chat', async (req, res) => {
  const { message, scenario, discussionHistory } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      message: 'message is required.',
    });
  }

  if (!checkScenarioRateLimit(req.ip)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Please wait a moment before sending another message.',
    });
  }

  if (!geminiReady) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'GEMINI_API_KEY not configured. Open .env and paste your key.',
      hint: 'Get a free key at https://aistudio.google.com/apikey then restart the server.',
    });
  }

  try {
    const cleanScenario = sanitizeScenarioJson(scenario || {});
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildScenarioCharacterPrompt(message, cleanScenario, discussionHistory),
      config: { responseMimeType: 'application/json' },
    });
    const characterReply = sanitizeCharacterReplyJson(parseGeminiJson(response.text), cleanScenario);

    return res.json({
      success: true,
      requestId: `character-${Date.now()}`,
      characterReply,
    });
  } catch (err) {
    const isKeyError = /api.?key|auth|permission|403|401/i.test(err.message);
    return res.status(isKeyError ? 401 : 502).json({
      error: isKeyError ? 'Unauthorized' : 'Character Chat Failed',
      message: err.message,
      hint: isKeyError
        ? 'Check your GEMINI_API_KEY in .env'
        : 'Gemini could not produce a valid character reply. Try a shorter message.',
    });
  }
});

app.get('/api/state/:playerName', async (req, res) => {
  if (db) {
    const snap = await db.ref(`players/${sanitizePlayerKey(req.params.playerName)}`).once('value');
    return res.json(snap.val() || {});
  }

  const memoryState = memoryPlayers.get(sanitizePlayerKey(req.params.playerName));
  return res.json(memoryState || state);
});

app.get('/api/state', (_req, res) => res.json(state));

app.post('/api/reset', (_req, res) => {
  state = createInitialState();
  memoryPlayers.clear();
  res.json({ success: true, message: 'In-memory state has been reset.' });
});

app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'API endpoint not found.' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  🌿 NeuroBloom — Quiet Progress`);
    console.log(`  ${'─'.repeat(41)}`);
    console.log(`  Landing   : http://localhost:${PORT}`);
    console.log(`  Dashboard : http://localhost:${PORT}/dashboard.html`);
    console.log(`  Auth      : http://localhost:${PORT}/auth.html`);
    console.log(`  Constructor: http://localhost:${PORT}/scenario-constructor`);
    if (!geminiReady) {
      console.log('\n  ⚠️  GEMINI_API_KEY not set — open .env and paste your key.\n');
    } else {
      console.log(`\n  ✅  Gemini ready (${GEMINI_MODEL})`);
      console.log(`  ${db ? '✅' : '⚠️ '}  Firebase ${db ? 'ready' : 'running in local fallback mode'}\n`);
    }
  });
}

module.exports = app;
