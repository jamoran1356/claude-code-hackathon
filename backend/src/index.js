/**
 * PromptMind Backend - Prompt Stock Market API
 * Claude Code Hackathon 2026
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Claude
const client = new Anthropic();

// In-memory storage (replace with DB later)
const prompts = new Map();
const trades = [];
let promptId = 1;

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'PromptMind API running',
    timestamp: new Date().toISOString()
  });
});

// Get all prompts
app.get('/api/prompts', (req, res) => {
  try {
    const promptsList = Array.from(prompts.values())
      .sort((a, b) => b.qualityScore - a.qualityScore);
    
    res.json({
      success: true,
      count: promptsList.length,
      prompts: promptsList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single prompt
app.get('/api/prompts/:id', (req, res) => {
  try {
    const prompt = prompts.get(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({
      success: true,
      prompt,
      trades: trades.filter(t => t.promptId === req.params.id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new prompt
app.post('/api/prompts', async (req, res) => {
  try {
    const { title, description, category, creator } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`\n📝 Creating prompt: "${title}"`);
    console.log(`📊 Evaluating with Claude...\n`);

    // Evaluate prompt with Claude
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Evaluate this prompt on a scale of 1-100. Only respond with:
SCORE: [number]
REASON: [one sentence]

Prompt: "${description}"`
      }]
    });

    const response = message.content[0].text;
    const scoreMatch = response.match(/SCORE:\s*(\d+)/);
    const qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 50;

    const newPrompt = {
      id: String(promptId++),
      title,
      description,
      category: category || 'general',
      creator: creator || 'Anonymous',
      qualityScore,
      tokenPrice: qualityScore / 10, // $5-10 range
      supply: 1000,
      circulation: 0,
      totalUsage: 0,
      createdAt: new Date().toISOString(),
      evaluation: response
    };

    prompts.set(newPrompt.id, newPrompt);

    console.log(`✅ Prompt created: ${newPrompt.id}`);
    console.log(`📊 Quality Score: ${qualityScore}/100`);
    console.log(`💰 Token Price: $${newPrompt.tokenPrice.toFixed(2)}\n`);

    res.status(201).json({
      success: true,
      prompt: newPrompt
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Execute prompt (simulate usage)
app.post('/api/prompts/:id/execute', async (req, res) => {
  try {
    const prompt = prompts.get(req.params.id);
    
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const { userInput } = req.body;

    console.log(`\n🚀 Executing prompt: "${prompt.title}"`);
    console.log(`📥 User input: "${userInput}"`);

    // Execute prompt with Claude
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `${prompt.description}\n\nUser request: ${userInput}`
      }]
    });

    const result = message.content[0].text;

    // Update usage
    prompt.totalUsage++;
    prompt.circulation = Math.min(prompt.supply, prompt.circulation + 1);

    // Simulate fee distribution
    const fee = 0.01; // $0.01 per use
    const creatorEarnings = fee * 0.5;
    const protocolEarnings = fee * 0.4;
    const validatorEarnings = fee * 0.1;

    console.log(`✅ Prompt executed successfully`);
    console.log(`📊 Usage count: ${prompt.totalUsage}`);
    console.log(`💰 Fee distributed: Creator $${creatorEarnings}, Protocol $${protocolEarnings}\n`);

    res.json({
      success: true,
      result,
      usage: prompt.totalUsage,
      earnings: {
        creator: creatorEarnings,
        protocol: protocolEarnings,
        validator: validatorEarnings
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Trade prompt (buy/sell)
app.post('/api/trades', (req, res) => {
  try {
    const { promptId, action, amount, trader } = req.body;

    const prompt = prompts.get(promptId);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    const trade = {
      id: trades.length + 1,
      promptId,
      action, // 'buy' or 'sell'
      amount,
      price: prompt.tokenPrice,
      total: amount * prompt.tokenPrice,
      trader: trader || 'Anonymous',
      timestamp: new Date().toISOString()
    };

    trades.push(trade);

    // Update circulation
    if (action === 'buy') {
      prompt.circulation = Math.min(prompt.supply, prompt.circulation + amount);
      prompt.tokenPrice *= 1.01; // Price increases with demand
    } else if (action === 'sell') {
      prompt.circulation = Math.max(0, prompt.circulation - amount);
      prompt.tokenPrice *= 0.99; // Price decreases with supply
    }

    console.log(`\n💱 Trade executed:`);
    console.log(`   Prompt: ${prompt.title}`);
    console.log(`   Action: ${action.toUpperCase()}`);
    console.log(`   Amount: ${amount} tokens`);
    console.log(`   Price: $${trade.price.toFixed(2)}`);
    console.log(`   Total: $${trade.total.toFixed(2)}\n`);

    res.status(201).json({
      success: true,
      trade,
      updatedPrompt: prompt
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = Array.from(prompts.values())
      .sort((a, b) => {
        const scoreA = b.qualityScore * (1 + b.totalUsage / 1000);
        const scoreB = a.qualityScore * (1 + a.totalUsage / 1000);
        return scoreB - scoreA;
      })
      .slice(0, 20)
      .map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        title: p.title,
        creator: p.creator,
        qualityScore: p.qualityScore,
        tokenPrice: p.tokenPrice.toFixed(2),
        usage: p.totalUsage,
        roi: ((p.tokenPrice / (p.qualityScore / 10) - 1) * 100).toFixed(1)
      }));

    res.json({
      success: true,
      leaderboard
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Breed prompts (combine two)
app.post('/api/breed', async (req, res) => {
  try {
    const { parent1Id, parent2Id, breeder } = req.body;

    const parent1 = prompts.get(parent1Id);
    const parent2 = prompts.get(parent2Id);

    if (!parent1 || !parent2) {
      return res.status(404).json({ error: 'One or both parents not found' });
    }

    console.log(`\n🧬 Breeding prompts:`);
    console.log(`   Parent 1: ${parent1.title}`);
    console.log(`   Parent 2: ${parent2.title}`);
    console.log(`   Using Claude to create hybrid...\n`);

    // Use Claude to create hybrid prompt
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Create a hybrid prompt that combines the best aspects of these two:

Parent 1: "${parent1.description}"

Parent 2: "${parent2.description}"

Provide a NEW prompt description that inherits traits from both.`
      }]
    });

    const hybridDescription = message.content[0].text;
    const hybridTitle = `${parent1.title} × ${parent2.title}`;

    // Evaluate hybrid
    const evalMessage = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Rate this hybrid prompt 1-100:\n\n${hybridDescription}\n\nRespond: SCORE: [number]`
      }]
    });

    const scoreMatch = evalMessage.content[0].text.match(/SCORE:\s*(\d+)/);
    const qualityScore = scoreMatch ? parseInt(scoreMatch[1]) : 60;

    const hybrid = {
      id: String(promptId++),
      title: hybridTitle,
      description: hybridDescription,
      category: 'hybrid',
      creator: breeder || 'Anonymous',
      qualityScore,
      tokenPrice: (parent1.tokenPrice + parent2.tokenPrice) / 2,
      supply: 500,
      circulation: 0,
      totalUsage: 0,
      parents: [parent1Id, parent2Id],
      createdAt: new Date().toISOString()
    };

    prompts.set(hybrid.id, hybrid);

    console.log(`✅ Hybrid created: ${hybrid.id}`);
    console.log(`📊 Quality Score: ${qualityScore}/100`);
    console.log(`💰 Token Price: $${hybrid.tokenPrice.toFixed(2)}\n`);

    res.status(201).json({
      success: true,
      hybrid
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVER START
// ============================================================================

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PromptMind Backend Started');
  console.log('='.repeat(60));
  console.log(`\n📍 API running on: http://localhost:${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Prompts: http://localhost:${PORT}/api/prompts`);
  console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`);
  console.log(`\n🤖 Claude API: Connected`);
  console.log('\n' + '='.repeat(60) + '\n');
});

module.exports = app;
