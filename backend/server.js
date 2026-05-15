process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const express = require('express');
const cors = require('cors');
require('dotenv').config();
 
const app = express();
 
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
 
app.use(express.json({ limit: '50mb' }));
 
const GROQ_API_KEY = process.env.GROQ_API_KEY;
 
if (!GROQ_API_KEY) {
  console.error('❌ ERREUR: GROQ_API_KEY manquante dans .env');
  process.exit(1);
}
 
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
 
app.post('/api/chat', async (req, res) => {
  try {
    console.log('📨 Requête reçue');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
 
    const responseText = await response.text();
    // ✅ Toujours retourner du JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Groq returned non-JSON:', responseText.substring(0, 200));
      return res.status(500).json({
        error: { message: 'Groq returned invalid response' },
        rawResponse: responseText.substring(0, 500)
      });
    }
    if (!response.ok) {
      console.error(`❌ Groq error ${response.status}:`, data?.error?.message);
      // ✅ Si rate limit, extraire le délai
      if (response.status === 429) {
        const retryAfterHeader = response.headers.get('retry-after');
        const errorMsg = data?.error?.message || '';
        const matchSeconds = errorMsg.match(/try again in (\d+)/i);
        const retryAfter = matchSeconds ? parseInt(matchSeconds[1]) : (retryAfterHeader ? parseInt(retryAfterHeader) : 60);
        console.log(`⏳ Rate limited, retry after ${retryAfter}s`);
        return res.status(429).json({
          error: { message: errorMsg || 'Rate limit exceeded' },
          retryAfter
        });
      }
      return res.status(response.status).json(data);
    }
 
    console.log('✅ Réponse Groq OK');
    res.json(data);
  } catch (error) {
    console.error('❌ Erreur serveur:', error.message);
    res.status(500).json({ 
      error: { message: error.message }
    });
  }
});
 
const PORT = 5000;
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`🔑 Groq key: ${GROQ_API_KEY ? '✅ Loaded' : '❌ MISSING'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});