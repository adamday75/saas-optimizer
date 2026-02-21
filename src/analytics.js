import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database file path
const dbPath = path.join(__dirname, '../data/usage.json');

// Initialize lowdb
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, {
  requests: [],
  totalRequests: 0,
  totalCost: 0,
  totalTokens: 0,
  totalCacheHits: 0,
  totalCacheMisses: 0,
  dailyStats: {}
});

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Load database (sync for simplicity, can be async in production)
 */
async function loadDb() {
  await db.read();
}

/**
 * Record an API request
 * @param {Object} data - Request data
 */
export async function recordRequest(data) {
  await loadDb();

  const now = new Date();
  const dateKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

  // Update daily stats
  if (!db.data.dailyStats[dateKey]) {
    db.data.dailyStats[dateKey] = {
      requests: 0,
      cost: 0,
      tokens: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  db.data.dailyStats[dateKey].requests++;
  db.data.dailyStats[dateKey].cost += data.cost || 0;
  db.data.dailyStats[dateKey].tokens += data.tokens || 0;
  db.data.dailyStats[dateKey][data.cacheHit ? 'cacheHits' : 'cacheMisses']++;

  // Update totals
  db.data.totalRequests++;
  db.data.totalCost += data.cost || 0;
  db.data.totalTokens += data.tokens || 0;
  if (data.cacheHit) {
    db.data.totalCacheHits++;
  } else {
    db.data.totalCacheMisses++;
  }

  // Add request record (limited to last 1000 to keep file small)
  db.data.requests.push({
    ...data,
    timestamp: now.toISOString(),
    date: dateKey
  });

  if (db.data.requests.length > 1000) {
    db.data.requests = db.data.requests.slice(-1000);
  }

  await db.write();
}

/**
 * Get usage statistics
 * @returns {Object} Usage stats
 */
export async function getStats() {
  await loadDb();

  const cacheHitRate = db.data.totalRequests > 0
    ? (db.data.totalCacheHits / db.data.totalRequests * 100).toFixed(1)
    : 0;

  return {
    totalRequests: db.data.totalRequests,
    totalCost: db.data.totalCost.toFixed(4),
    totalTokens: db.data.totalTokens,
    cacheHitRate: `${cacheHitRate}%`,
    cacheHits: db.data.totalCacheHits,
    cacheMisses: db.data.totalCacheMisses,
    dailyStats: db.data.dailyStats,
    recentRequests: db.data.requests.slice(-20).reverse() // last 20
  };
}

/**
 * Get stats for specific date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Object} Stats for date range
 */
export async function getStatsForRange(startDate, endDate) {
  await loadDb();

  // Filter daily stats by date range
  const rangeStats = {};
  for (let i = 0; i <= 30; i++) { // max 30 days
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    if (db.data.dailyStats[dateKey]) {
      rangeStats[dateKey] = db.data.dailyStats[dateKey];
    }

    if (dateKey === endDate) break;
  }

  const rangeTotals = Object.values(rangeStats).reduce((acc, day) => ({
    requests: acc.requests + day.requests,
    cost: acc.cost + day.cost,
    tokens: acc.tokens + day.tokens,
    cacheHits: acc.cacheHits + day.cacheHits,
    cacheMisses: acc.cacheMisses + day.cacheMisses
  }), { requests: 0, cost: 0, tokens: 0, cacheHits: 0, cacheMisses: 0 });

  return {
    rangeStats,
    rangeTotals,
    days: Object.keys(rangeStats).length
  };
}

/**
 * Clear all data (for testing)
 */
export async function clearAll() {
  db.data = {
    requests: [],
    totalRequests: 0,
    totalCost: 0,
    totalTokens: 0,
    totalCacheHits: 0,
    totalCacheMisses: 0,
    dailyStats: {}
  };
  await db.write();
}

export default {
  recordRequest,
  getStats,
  getStatsForRange,
  clearAll
};