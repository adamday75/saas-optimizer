import express from 'express';
import { processChatCompletion } from './proxy/openai.js';
import { getStats } from './analytics.js';
import { getStats as getCacheStats } from './cache.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main proxy endpoint for OpenAI chat completions
app.post('/v1/chat/completions', async (req, res) => {
  try {
    const response = await processChatCompletion(req.body);

    // Add optimization headers
    res.setHeader('X-Optimized-By', 'AI-API-Optimizer');

    res.json(response);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(error.status || 500).json({
      error: {
        message: error.message || 'Internal server error',
        type: error.type || 'api_error'
      }
    });
  }
});

// Analytics endpoints
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    const cacheStats = getCacheStats();
    res.json({ ...stats, cache: cacheStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard (simple HTML view)
app.get('/', async (req, res) => {
  try {
    const stats = await getStats();
    const cacheStats = getCacheStats();

    res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>AI API Optimizer - Dashboard</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .card { background: #f5f5f5; padding: 20px; border-radius: 8px; }
    .card h3 { margin: 0 0 10px 0; color: #333; }
    .card .value { font-size: 2em; font-weight: bold; color: #0066cc; }
    .recent { margin-top: 40px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #333; color: white; }
    .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
    .badge.hit { background: #4CAF50; color: white; }
    .badge.miss { background: #f44336; color: white; }
  </style>
</head>
<body>
  <h1>🚀 AI API Optimizer</h1>
  
  <div class="stats">
    <div class="card">
      <h3>Total Requests</h3>
      <div class="value">${stats.totalRequests}</div>
    </div>
    <div class="card">
      <h3>Total Cost</h3>
      <div class="value">$${stats.totalCost}</div>
    </div>
    <div class="card">
      <h3>Total Tokens</h3>
      <div class="value">${stats.totalTokens.toLocaleString()}</div>
    </div>
    <div class="card">
      <h3>Cache Hit Rate</h3>
      <div class="value">${stats.cacheHitRate}</div>
    </div>
  </div>

  <div class="recent">
    <h2>Recent Requests</h2>
    <table>
      <tr>
        <th>Time</th>
        <th>Provider</th>
        <th>Model</th>
        <th>Cost</th>
        <th>Tokens</th>
        <th>Cache</th>
      </tr>
      ${stats.recentRequests.map(req => `
      <tr>
        <td>${new Date(req.timestamp).toLocaleTimeString()}</td>
        <td>${req.provider}</td>
        <td>${req.model}${req.originalModel && req.originalModel !== req.model ? ` (${req.originalModel})` : ''}</td>
        <td>$${req.cost?.toFixed(4) || '0.0000'}</td>
        <td>${req.tokens || 0}</td>
        <td><span class="badge ${req.cacheHit ? 'hit' : 'miss'}">${req.cacheHit ? 'HIT' : 'MISS'}</span></td>
      </tr>
      `).join('')}
      ${stats.recentRequests.length === 0 ? '<tr><td colspan="6" style="text-align:center">No requests yet</td></tr>' : ''}
    </table>
  </div>

  <div class="recent">
    <h2>API Usage</h2>
    <p><strong>Proxy endpoint:</strong> POST /v1/chat/completions</p>
    <p><strong>Example (using OpenAI SDK):</strong></p>
    <pre>
const client = new OpenAI({
  baseURL: 'http://localhost:${PORT}/v1',
  apiKey: 'your-api-key' // Still required by SDK
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
    </pre>
  </div>
</body>
</html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AI API Optimizer running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔄 Proxy endpoint: http://localhost:${PORT}/v1/chat/completions`);
  console.log(`\nReady to optimize your AI API costs!\n`);
});