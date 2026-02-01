const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic();

// Parse workflow from description
app.post('/api/generate-workflow', async (req, res) => {
  try {
    const { description } = req.body;
    
    console.log(`📝 Generating workflow for: "${description}"`);
    
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Convert this workflow description into executable Node.js code:

"${description}"

Provide ONLY the code, no explanation. Use async/await. Include error handling.
Use common libraries like axios, nodemailer, etc.`
      }]
    });
    
    const generatedCode = message.content[0].text;
    
    res.json({
      success: true,
      description,
      code: generatedCode,
      message: 'Workflow generated successfully'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AutoFlow API running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 AutoFlow Backend running on port ${PORT}`);
  console.log(`📌 Claude API ready`);
});
