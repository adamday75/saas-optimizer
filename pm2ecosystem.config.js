// pm2ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'api-optimizer',
      script: './src/index.js',
      interpreter: 'node',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        // You’ll override these in Fly secrets below
        OPENAI_API_KEY: 'sk-xxxx',
        STRIPE_SECRET_KEY: 'sk_test_xxxxx',
        STRIPE_WEBHOOK_SECRET: 'whsec_xxxxxx',
        PRICE_BASIC_ID: 'price_xxxxx',
        ROOT_URL: 'https://ai-optimizer.fly.dev',
        ENABLE_CACHE: 'true',
        ENABLE_SMART_ROUTING: 'true',
        CACHE_TTL: '300',
      },
    },
  ],
};
