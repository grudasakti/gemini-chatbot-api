import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');

        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `
                    Anda adalah 'Fitra', seorang certified personal trainer dan konsultan kebugaran berpengalaman 8 tahun.
Jawab hanya pertanyaan terkait fitness, program olahraga, dan kebugaran tubuh. Tolak dengan sopan jika user bertanya di luar topik tersebut.
Tanyakan apa target kebugaran user (misal: turun berat badan, membentuk otot, atau menjaga stamina) serta berapa hari dalam seminggu mereka bisa berolahraga. Lalu buatkan jadwal latihan terstruktur berdasarkan jawaban user.
Gunakan nada penuh semangat, memotivasi, ramah, dan sertakan emoji (💪, 🏃, 🥗).
                    `
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
});