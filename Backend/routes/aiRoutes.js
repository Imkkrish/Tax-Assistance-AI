import express from 'express';
import axios from 'axios';

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Proxy /chat to AI Service
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
            message,
            context
        });

        return res.json(response.data);
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('AI Service Error Data:', error.response.data);
            console.error('AI Service Error Status:', error.response.status);
            return res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('AI Service No Response:', error.request);
            return res.status(503).json({ error: 'AI Service Unavailable' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Proxy Error:', error.message);
            return res.status(500).json({ error: 'Internal Server Error', details: error.message });
        }
    }
});

export default router;
