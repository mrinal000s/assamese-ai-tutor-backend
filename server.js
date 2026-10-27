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

// Currently supported active Gemini models
const CANDIDATE_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.8-flash-lite',
    'gemini-3.8-pro'
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // Loop through active candidate models
    for (const modelName of CANDIDATE_MODELS) {
        // Attempt up to 3 times per model if a 503 spike occurs
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`Calling ${modelName} (Attempt ${attempt})...`);
                const response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt
                });

                replyText = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text);
                if (replyText) {
                    console.log(`Successfully generated response using: ${modelName}`);
                    break;
                }
            } catch (err) {
                console.warn(`Error on ${modelName} (attempt ${attempt}): ${err.message}`);
                
                // If it's a 503 busy spike, wait and retry
                if (err.message && err.message.includes('503') && attempt < 3) {
                    const waitTime = attempt * 1200; // 1.2s, 2.4s
                    console.log(`503 high demand detected. Retrying in ${waitTime}ms...`);
                    await sleep(waitTime);
                } else {
                    // If it's a 404 or persistent error, skip immediately to the next model
                    break;
                }
            }
        }
        if (replyText) break;
    }

    if (replyText) {
        return res.json({ reply: replyText });
    }

    return res.status(503).json({
        error: "শিক্ষক মহোদয় বৰ্তমান ব্যস্ত। অনুগ্ৰহ কৰি কিছু সময় পাছত পুনৰ চেষ্টা কৰক।"
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
