import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Initialize Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.get('/', (req, res) => {
    res.send("Assamese AI Tutor Backend is Live!");
});

app.post('/chat', async (req, res) => {
    try {
        const { message, grade, subject } = req.body;
        console.log(`Received question: "${message}" for ${grade} - ${subject}`);

        const prompt = `You are a helpful and expert AI tutor for Assamese medium students (SEBA Board, Assam).
Student Grade: ${grade || 'Grade 10'}
Subject: ${subject || 'Science'}
Student Question: ${message}

Instructions:
1. Provide a direct, easy-to-understand, and encouraging explanation written primarily in natural Assamese.
2. Put important scientific/technical terms in English inside parentheses right next to the Assamese term (e.g., সালোকসংশ্লেষণ (Photosynthesis)).
3. Keep the response concise enough for high-school students.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt
        });

        // Safe extraction of text
        const replyText = response.text || "উত্তৰ প্ৰস্তুত কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।";
        console.log("Response generated successfully.");

        res.json({ reply: replyText });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
