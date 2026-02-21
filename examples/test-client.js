/**
 * Example client to test the AI API Optimizer
 *
 * Usage:
 * 1. Set OPENAI_API_KEY in .env
 * 2. Run: node examples/test-client.js
 */

import OpenAI from 'openai';

// Create OpenAI client pointing to our proxy
const client = new OpenAI({
  baseURL: 'http://localhost:3000/v1',
  apiKey: process.env.OPENAI_API_KEY || 'test-key'
});

async function testProxy() {
  console.log('🧪 Testing AI API Optimizer proxy...\n');

  // Test 1: Simple request (should route to gpt-3.5)
  console.log('Test 1: Simple request (expects gpt-3.5-turbo)');
  try {
    const response1 = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.7
    });
    console.log(`Model actually used: ${response1.model}`);
    console.log(`Response: ${response1.choices[0].message.content}\n`);
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }

  // Test 2: Same request again (should hit cache)
  console.log('Test 2: Same request (expects cache hit)');
  try {
    const response2 = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.7
    });
    console.log(`Response: ${response2.choices[0].message.content}`);
    console.log('📊 Check dashboard: curl http://localhost:3000/api/stats\n');
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }

  // Test 3: Complex request with code (should use gpt-4)
  console.log('Test 3: Complex request with code (expects gpt-4)');
  try {
    const response3 = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a coding assistant.' },
        { role: 'user', content: 'Write a function to sort an array in JavaScript' }
      ]
    });
    console.log(`Model actually used: ${response3.model}`);
    console.log(`Tokens used: ${response3.usage.total_tokens}\n`);
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
  }

  console.log('✅ Tests complete!\n');
  console.log('View dashboard: http://localhost:3000');
  console.log('View stats: http://localhost:3000/api/stats');
}

testProxy().catch(console.error);