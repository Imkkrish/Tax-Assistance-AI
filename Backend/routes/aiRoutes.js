import express from 'express';
import axios from 'axios';
import { protect, optionalAuth } from '../middleware/auth.js';
import TaxCalculation from '../models/TaxCalculation.js';
import TaxDocument from '../models/TaxDocument.js';

const router = express.Router();

let AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
if (process.env.AI_SERVICE_URL && !process.env.AI_SERVICE_URL.startsWith('http')) {
    AI_SERVICE_URL = `https://${process.env.AI_SERVICE_URL}`;
}

// Proxy /chat to AI Service
// Using optionalAuth so it works even if frontend doesn't send token yet (though it should)
router.get('/wakeup', async (req, res) => {
    try {
        console.log("Waking up AI Service...");
        // Short timeout for wake-up check, we just want to trigger it
        await axios.get(`${AI_SERVICE_URL}/`, { timeout: 5000 }).catch(() => { });
        res.json({ status: 'waking_up', message: 'AI Service wake-up signal sent' });
    } catch (error) {
        console.error("Wake-up error:", error.message);
        res.status(200).json({ status: 'waking_up', message: 'Wake-up signal attempt failed but backend is alive' });
    }
});

// Proxy /chat to AI Service
// Using optionalAuth so it works even if frontend doesn't send token yet (though it should)
router.post('/chat', optionalAuth, async (req, res) => {
    try {
        const { message, context } = req.body;

        // Validate input
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Build User Context from DB if user is logged in
        let dbContext = "";
        if (req.user) {
            try {
                // Get latest tax calculation
                const taxCalc = await TaxCalculation.findOne({ user: req.user._id })
                    .sort({ createdAt: -1 })
                    .select('inputData calculationResults financialYear taxRegime');

                // Get recent processed documents
                const documents = await TaxDocument.find({
                    user: req.user._id,
                    processingStatus: 'completed'
                })
                    .sort({ createdAt: -1 })
                    .limit(3)
                    .select('documentType extractedData aiAnalysis filename');

                if (taxCalc) {
                    dbContext += `\n[USER TAX PROFILE]\nFinancial Year: ${taxCalc.financialYear}\nRegime: ${taxCalc.taxRegime}\nIncome/Deductions: ${JSON.stringify(taxCalc.inputData)}\nResults: ${JSON.stringify(taxCalc.calculationResults)}\n`;
                }

                if (documents.length > 0) {
                    dbContext += `\n[UPLOADED DOCUMENTS]\n${documents.map(d =>
                        `- ${d.documentType} (${d.filename}): ${JSON.stringify(d.extractedData || d.aiAnalysis)}`
                    ).join('\n')}\n`;
                }
            } catch (err) {
                console.error("Error fetching user stats for AI context:", err);
                // Continue without context if DB fetch fails
            }
        }

        // 2. Append DB Context with a clear separator so the AI knows this is system-provided data
        const enrichedContext = `${context || ''}\n${dbContext ? `\n\n=== SYSTEM DATA ===\n${dbContext}\n===================\n` : ''}`;

        console.log("Sending to AI with Context Length:", enrichedContext.length);

        const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
            message,
            context: enrichedContext
        }, {
            timeout: 300000 // 5 minutes timeout for AI cold start
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
