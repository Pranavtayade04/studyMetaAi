import { GoogleGenAI } from '@google/genai';
import recordActivity from '../utils/recordActivity.js';

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 3000;

function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      const err = new Error('The AI Tutor request timed out. Please try again.');
      err.status = 504;
      setTimeout(() => reject(err), ms);
    }),
  ]);
}

export async function chat(req, res) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey || /^(demo-key|your[-_ ].*|replace[-_ ].*)$/i.test(apiKey)) {
    return res.status(503).json({
      message: 'The AI Tutor is not configured yet. Add GEMINI_API_KEY to backend/.env.',
    });
  }

  const messages = req.body?.messages;
  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > MAX_MESSAGES
  ) {
    return res.status(400).json({
      message: `Send between 1 and ${MAX_MESSAGES} conversation messages.`,
    });
  }

  const validMessages = messages.every(
    (message) =>
      message &&
      ['user', 'model'].includes(message.role) &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0 &&
      message.content.length <= MAX_MESSAGE_LENGTH
  );

  if (!validMessages || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({
      message: 'Messages must contain valid user and assistant text, with a user message last.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const transcript = messages
      .map(({ role, content }) =>
        `${role === 'user' ? 'Student' : 'StudyMeta AI'}: ${content.trim()}`
      )
      .join('\n\n');
    const interaction = await withTimeout(
      ai.interactions.create({
        model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
        input: transcript,
        system_instruction:
          'You are StudyMeta AI, a patient and encouraging study tutor. Explain concepts clearly, use examples, and adapt to the student’s level. Keep answers focused and educational. If asked for an answer to a problem, explain the reasoning.',
      }),
      10000
    );

    const answer = interaction.output_text?.trim();
    if (!answer) {
      return res.status(502).json({
        message: 'The AI Tutor did not return a text answer. Please try again.',
      });
    }

    await recordActivity(req.user._id, 'tutor', 'Asked AI Tutor a study question');
    return res.json({ answer });
  } catch (error) {
    const status = error.status;
    console.error('Gemini tutor request failed:', {
      status: Number.isInteger(status) ? status : undefined,
      name: error.name,
    });

    if (status === 429) {
      return res.status(503).json({
        message: 'The AI Tutor is busy right now. Please wait a moment and try again.',
      });
    }

    if (status === 401 || status === 403) {
      return res.status(503).json({
        message: 'The AI Tutor is unavailable because its API key is invalid or lacks access.',
      });
    }

    return res.status(502).json({
      message: error.message || 'The AI Tutor could not generate a reply. Please try again.',
    });
  }
}
