import OpenAI from 'openai';
import { generateCacheKey, getCached, setCached } from '../cache.js';
import { recommendModel, calculateCost, estimateTokens } from '../routing.js';
import { recordRequest } from '../analytics.js';

// Lazy initialization - only create client when needed
let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey === 'test') {
      throw new Error('OPENAI_API_KEY not configured. Please set a valid API key in .env');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Process OpenAI chat completion request
 * @param {Object} requestBody - Request body
 * @returns {Object} Response
 */
export async function processChatCompletion(requestBody) {
  const cacheEnabled = process.env.ENABLE_CACHE === 'true';
  const smartRouting = process.env.ENABLE_SMART_ROUTING === 'true';

  // Get cache key
  const cacheKey = generateCacheKey(requestBody, 'openai');

  // Check cache first
  if (cacheEnabled) {
    const cached = getCached(cacheKey);
    if (cached) {
      await recordRequest({
        provider: 'openai',
        model: requestBody.model,
        cacheHit: true,
        cost: 0,
        tokens: 0,
        cached: true
      });
      return cached;
    }
  }

  // Smart routing - recommend cheaper model if applicable
  let finalModel = requestBody.model;
  let recommendation = null;

  if (smartRouting) {
    recommendation = recommendModel(requestBody, 'openai', requestBody.model);
    finalModel = recommendation.model;
  }

  try {
    // Make actual API call
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: finalModel,
      messages: requestBody.messages,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      stream: requestBody.stream || false
    });

    // Calculate cost
    const totalTokens = response.usage?.total_tokens || 0;
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;
    const cost = calculateCost('openai', finalModel, inputTokens, outputTokens);

    // Cache response
    if (cacheEnabled) {
      // Cache for 5 minutes (can be made configurable)
      setCached(cacheKey, response, 300);
    }

    // Record analytics
    await recordRequest({
      provider: 'openai',
      model: finalModel,
      originalModel: requestBody.model,
      cacheHit: false,
      cost,
      tokens: totalTokens,
      recommendation: recommendation ? recommendation.reason : null,
      savings: recommendation ? recommendation.savings : 0
    });

    // Return with savings info in headers (for dashboard)
    return response;

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

/**
 * Simple prompt compression (MVP - can be expanded)
 * @param {Array} messages - Chat messages
 * @returns {Array} Compressed messages
 */
export function compressPrompt(messages) {
  // Simple compression strategies:
  // 1. Remove duplicate consecutive messages
  // 2. Truncate very long system messages
  // 3. Remove common boilerplate

  if (!Array.isArray(messages)) return messages;

  const compressed = [];
  let prevContent = null;

  messages.forEach(msg => {
    const content = msg.content;

    // Skip duplicates
    if (content === prevContent) return;
    prevContent = content;

    // Truncate very long system messages
    if (msg.role === 'system' && content.length > 1000) {
      compressed.push({
        role: 'system',
        content: content.substring(0, 1000) + '... [truncated]'
      });
    } else {
      compressed.push(msg);
    }
  });

  return compressed;
}

export default {
  processChatCompletion,
  compressPrompt
};