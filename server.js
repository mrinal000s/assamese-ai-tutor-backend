import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
    res.send("Assamese AI Tutor Backend is Live!");
});

// Candidate models in order of priority
const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash'
];

app.post('/chat', async (req, res) => {
    const { message, grade, subject } = req.body;
    console.log(`Received question: "${message}" for ${grade} - ${subject}`);

    const prompt = `You are a helpful and expert AI tutor for Assamese medium students (SEBA Board, Assam).
Student Grade: ${grade || 'Grade 10'}
Subject: ${subject || 'Science'}
Student Question: ${message}

Instructions:
1. Provide a direct, clear, and encouraging explanation written primarily in natural Assamese.
2. Put important scientific/technical terms in English inside parentheses right next to the Assamese term (e.g., সালোকসংশ্লেষণ (Photosynthesis)).
3. Keep the response well-structured and educational.`;

    let replyText = null;
    let lastError = null;

    // Iterate through available models until one succeeds
    for (const modelName of CANDIDATE_MODELS) {
        try {
            console.log(`Attempting generation with model: ${modelName}...`);
            const response = await ai.models.generateContent({
                model: modelName,
                contents: prompt
            });

            replyText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
            if (replyText) {
                console.log(`Success using model: ${modelName}`);
                break;
            }
        } catch (err) {
            console.warn(`Model ${modelName} unavailable or failed: ${err.message}`);
            lastError = err;
            // Continue immediately to next candidate model
        }
    }

    if (replyText) {
        return res.json({ reply: replyText });
    }

    console.error("All fallback models failed:", lastError);
    return res.status(503).json({
        error: "শিক্ষক মহোদয় বৰ্তমান ব্যস্ত। অনুগ্ৰহ কৰি কিছু সময় পাছত পুনৰ চেষ্টা কৰক।"
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
