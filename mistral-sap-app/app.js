const express = require('express');
const axios = require('axios');
const basicAuth = require('express-basic-auth');
require('dotenv').config();

const app = express();
app.use(express.json());

// Extract credentials from VCAP_SERVICES
let clientId, clientSecret;

if (process.env.VCAP_SERVICES) {
  try {
    const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    const xsuaaService = vcapServices.xsuaa.find(service => service.name === 'mistral');
    if (!xsuaaService) throw new Error("XSUAA service 'mistral' not found");

    clientId = xsuaaService.credentials.clientid;
    clientSecret = xsuaaService.credentials.clientsecret;
  } catch (err) {
    console.error("Error parsing VCAP_SERVICES:", err.message);
    process.exit(1);
  }
} else {
  console.error("VCAP_SERVICES is not set");
  process.exit(1);
}

// Implement Basic Authentication middleware
app.use(
  basicAuth({
    users: { [clientId]: clientSecret }, // Use credentials from VCAP_SERVICES
    challenge: true, // Prompts browsers for username/password
  })
);

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
          'Content-Type': 'application/json',
        }
      }
    );

    const output = response.data.choices[0].message.content;
    res.json({ response: output });
  } catch (err) {
    console.error("Error calling Mistral API:", err.response?.data || err.message);
    res.status(500).send("Error calling Mistral API");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
