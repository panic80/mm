import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { defaultTravelInstructions } from './travelData.js';
const app = express();

// Parse JSON request bodies with increased limit
app.use(express.json({ limit: '10mb' }));

// Enable CORS for production
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins in production
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Process content with enhanced formatting and semantic structure preservation
const processContent = (html) => {
  const $ = cheerio.load(html);
  // Remove unwanted elements such as scripts, styles, headers, footers, and navigation
  $('script, style, header, footer, nav').remove();
  const text = $('body').text();
  // Clean and format content while preserving newlines
  return text
    .replace(/\s+/g, ' ')
    .replace(/(\d+\.\d+\.\d+)/g, '\n$1')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([.!?])\s+/g, '$1\n')
    .trim();
};

const PORT = process.env.PORT || 3008;

// Sophisticated in-memory cache with TTL and automatic cleanup
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const CLEANUP_INTERVAL = 300000; // 5 minutes in milliseconds
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 10000; // 10 seconds in milliseconds

// Intelligent cache cleanup with logging and error handling
setInterval(() => {
  try {
    const now = Date.now();
    let cleanedEntries = 0;

    for (const [key, { timestamp }] of cache.entries()) {
      if (now - timestamp > CACHE_TTL) {
        cache.delete(key);
        cleanedEntries++;
      }
    }

    if (cleanedEntries > 0) {
      console.log(`Cache cleanup: removed ${cleanedEntries} expired entries`);
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}, CLEANUP_INTERVAL);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Proxy endpoint for Gemini API requests
app.post('/api/gemini/generateContent', async (req, res) => {
  try {
    const apiKey = req.query.key;
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const { contents } = req.body;
    const result = await model.generateContent(contents[0].parts[0].text);
    const response = await result.response;

    res.json({
      candidates: [{
        content: {
          parts: [{
            text: response.text()
          }]
        }
      }]
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Gemini API Error',
      message: error.message
    });
  }
});

// Proxy endpoint for travel instructions with comprehensive error handling and retry logic
app.get('/api/travel-instructions', async (req, res) => {
  try {
    // Check cache with detailed logging
    const cachedData = cache.get('travel-instructions');
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
      console.log('Serving fresh cached data, age:', Date.now() - cachedData.timestamp, 'ms');
      return res.json({ content: cachedData.content, cached: true });
    }

    console.log('Initiating fresh data fetch from source');
    let response;
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
      try {
        response = await axios.get(
          'https://www.canada.ca/en/department-national-defence/services/benefits-military/pay-pension-benefits/benefits/canadian-forces-temporary-duty-travel-instructions.html',
          {
            headers: {
              'Accept-Encoding': 'gzip, deflate, br',
              'User-Agent': 'Mozilla/5.0 (compatible; TravelInstructionsBot/1.0)',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache'
            },
            timeout: REQUEST_TIMEOUT
          }
        );
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === MAX_RETRIES) throw error;
        console.log(`Retry attempt ${retryCount} after error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    const content = processContent(response.data);
    console.log('Content processed successfully, length:', content.length);

    // Update cache with comprehensive metadata
    cache.set('travel-instructions', {
      content,
      timestamp: Date.now(),
      lastModified: response.headers['last-modified'],
      etag: response.headers.etag
    });

    res.json({ content, fresh: true });
  } catch (error) {
    console.error('Proxy error:', error.message, '\nStack:', error.stack);

    // Sophisticated fallback strategy
    const cachedData = cache.get('travel-instructions');
    if (cachedData) {
      console.log('Serving stale cache due to error, cache age:', Date.now() - cachedData.timestamp, 'ms');
      return res.json({
        content: cachedData.content,
        stale: true,
        cacheAge: Date.now() - cachedData.timestamp
      });
    }

    res.status(500).json({
      error: 'Failed to fetch travel instructions',
      message: error.message,
      retryAfter: 60 // Suggest retry after 1 minute
    });
  }
});

// Graceful server initialization with health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    cacheSize: cache.size,
    environment: process.env.NODE_ENV || 'production'
  });
});

// New /api/config endpoint
app.get('/api/config', (req, res) => {
  res.json({ config: 'default configuration' });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

app.listen(PORT, () => {
 console.log(`Proxy server running on port ${PORT}`);
 console.log(`Health check available at http://localhost:${PORT}/health`);
 console.log('Environment:', process.env.NODE_ENV || 'production');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Perform any cleanup if needed
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform any cleanup if needed
});
