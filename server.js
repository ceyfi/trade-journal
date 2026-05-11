require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/claude', async (req, res) => {
    console.log('Request received');
    console.log('API KEY:', process.env.ANTHROPIC_API_KEY ? 'loaded' : 'MISSING');
        try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
          });
          const data = await response.json();
          res.json(data);
    } catch (err) {
      console.error('Server error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.listen(4000, () => console.log('Server running on port 4000'));