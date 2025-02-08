import express from 'express';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();

// Parse JSON request bodies with increased limit
app.use(express.json({ limit: '10mb' }));

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

const PORT = process.env.PORT || 3008;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log('Environment:', process.env.NODE_ENV || 'production');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
