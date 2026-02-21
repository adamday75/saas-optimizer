# AI API Cost Optimizer 💰

**Middleware that cuts your AI API bills by 20-40%**

---

## What It Does

- **Smart caching** — identical requests hit cache, not the API
- **Cost routing** — cheapest model for the task (gpt-3.5 vs gpt-4)
- **Prompt compression** — remove redundancy, shrink tokens
- **Analytics dashboard** — see exactly where your money goes

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your OpenAI API key to .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# 3. Run the server
npm run dev
```

**Visit:** http://localhost:3000

---

## MVP Status

### ✅ Done
- [x] Proxy server (Node.js/Express)
- [x] OpenAI SDK integration
- [x] Request caching (node-cache)
- [x] Smart routing logic
- [x] Analytics + tracking
- [x] Dashboard UI

### 🚧 Next
- [ ] Prompt compression
- [ ] Auth (API keys, user accounts)
- [ ] Stripe payments
- [ ] Anthropic + Cohere support
- [ ] Production deployment

---

## Usage

### As a Proxy

Replace your OpenAI base URL:

```javascript
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: 'your-api-key' // Still required by SDK
});

// Use normally - optimizer handles the rest
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Check Your Savings

```bash
# View dashboard
curl http://localhost:3000

# Get stats as JSON
curl http://localhost:3000/api/stats
```

---

## Tech Stack

- **Backend:** Node.js + Express
- **Cache:** node-cache (in-memory, upgrade to Redis for prod)
- **Database:** lowdb (JSON file, upgrade to Postgres for prod)
- **AI:** OpenAI SDK
- **Hosting:** Fly.io or Railway (coming soon)

---

## Running Tests

```bash
# Start the server
npm run dev

# Run test client (in another terminal)
node examples/test-client.js
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/chat/completions` | POST | OpenAI-compatible proxy |
| `/api/stats` | GET | Usage statistics |
| `/` | GET | Dashboard UI |
| `/health` | GET | Health check |

---

## Why This Works

**Smart Routing Example:**
- You request **gpt-4** for a simple "hello"
- Analyzer: "Simple task → gpt-3.5-turbo sufficient"
- Router: Uses **gpt-3.5-turbo** instead
- Your cost: $0.0003 instead of $0.03 (100x savings!)
- Response quality: Nearly identical for simple tasks

**Cache Hit Example:**
- User asks: "What's 2+2?"
- First call: $0.0006 (goes to API)
- Same question again: $0 (from cache)
- Multiple users asking: All hit cache after first

---

## Planned Pricing

| Tier | Monthly | Features |
|------|---------|----------|
| Starter | $29/mo | 10k cached req, analytics |
| Growth | $99/mo | Unlimited cache, smart routing |
| Team | $299/mo | Multi-user, priority support |

**Or:** % of savings model (e.g., "pay 20% of what we save you")

---

## License

MIT