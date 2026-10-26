import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/chat', async (req, res) => {
    // Extract the new variables sent from index.html
    const { message, grade, subject } = req.body;
    
    // Dynamically build the persona using the selected grade and subject
    const tutorRules = `You are an expert AI tutor for Assamese medium students under the SEBA board. 
    You are currently teaching Grade ${grade} ${subject}. 
    Provide direct, comprehensive answers with step-by-step guidance in complete Assamese. 
    Important technical terms must be provided in English inside parentheses. 
    Keep the tone encouraging and strictly focused on the syllabus.`;

    let attempts = 3;

    while (attempts > 0) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: message,
                config: { systemInstruction: tutorRules }
            });
            return res.json({ reply: response.text });
        } catch (error) {
            attempts--;
            if (attempts === 0 || (!error.message.includes('503') && !error.message.includes('unavailable'))) {
                return res.status(500).json({ error: error.message });
            }
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});