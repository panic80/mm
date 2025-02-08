import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import HandbookScraper from './handbookScraper.js';

const app = express();
app.use(cors());
app.use(express.json());

let lastScrapeTime = null;
let isScrapingInProgress = false;

app.post('/api/scrape', async (req, res) => {
    if (isScrapingInProgress) {
        return res.status(409).json({ 
            error: 'Scraping already in progress',
            lastScrapeTime
        });
    }

    try {
        isScrapingInProgress = true;
        const scraper = new HandbookScraper({
            maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 2,
            minDelay: parseInt(process.env.MIN_REQUEST_DELAY) || 2000,
            maxDelay: parseInt(process.env.MAX_REQUEST_DELAY) || 5000,
            maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
            maxDepth: parseInt(process.env.MAX_DEPTH) || 2
        });

        console.log('Starting handbook scraping...');
        await scraper.start();
        lastScrapeTime = new Date().toISOString();
        console.log('Handbook scraping completed successfully');
        
        res.json({ 
            success: true,
            lastScrapeTime 
        });
    } catch (error) {
        console.error('Error during scraping:', error);
        res.status(500).json({ 
            error: 'Scraping failed',
            message: error.message
        });
    } finally {
        isScrapingInProgress = false;
    }
});

app.get('/api/scrape/status', (req, res) => {
    res.json({
        isScrapingInProgress,
        lastScrapeTime
    });
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Cleaning up...');
    process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
