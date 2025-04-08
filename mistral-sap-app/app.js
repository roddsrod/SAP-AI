// app.js

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();

const allowedOrigins = ['https://dt-lmr.test.apimanagement.us10.hana.ondemand.com'];

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/mistral', async (req, res) => {
  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).send("Prompt required");

  try {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: "mistral-tiny",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const output = response.data.choices[0].message.content;
    res.json({ response: output });

  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).send("Error calling Mistral");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
