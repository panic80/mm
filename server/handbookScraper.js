import puppeteer from 'puppeteer';
import PQueue from 'p-queue';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MongoClient } from 'mongodb';
import { setTimeout } from 'timers/promises';

class HandbookScraper {
    constructor(config = {}) {
        this.baseUrl = 'https://handbook.mattermost.com';
        this.config = {
            maxConcurrent: 1, // Reduced from 2 to 1 for better rate limiting
            minDelay: 3000,   // Increased from 2000 to 3000ms
            maxDelay: 7000,   // Increased from 5000 to 7000ms
            maxRetries: 3,
            maxQueueSize: 1000, // Added queue size limit
            ...config
        };
        
        this.queue = new PQueue({
            concurrency: this.config.maxConcurrent,
            interval: this.config.minDelay,
            intervalCap: 1,
            timeout: 30000, // Added timeout
            throwOnTimeout: false
        });

        this.visited = new Set();
        this.proxies = [];
        this.currentProxyIndex = 0;
        this.db = null;
        this.pagePool = []; // Added page pool for better resource management
        
        // Add queue event listeners
        this.queue.on('active', () => {
            console.log(`Working on item. Size: ${this.queue.size} Pending: ${this.queue.pending}`);
        });

        this.queue.on('completed', result => {
            console.log(`Task completed. Size: ${this.queue.size} Pending: ${this.queue.pending}`);
        });

        this.queue.on('error', error => {
            console.error('Queue error:', error);
        });

        // Add size limit to queue
        this.queue.on('add', () => {
            if (this.queue.size > this.config.maxQueueSize) {
                console.log('Queue size limit reached, pausing...');
                this.queue.pause();
                setTimeout(5000).then(() => {
                    console.log('Resuming queue');
                    this.queue.start();
                });
            }
        });
    }

    async initialize() {
        try {
            // Initialize MongoDB connection
            const client = await MongoClient.connect(process.env.MONGODB_URI);
            this.db = client.db('handbook');
            
            // Initialize collections
            await this.db.createCollection('pages');
            await this.db.createCollection('links');
            await this.db.createCollection('errors');

            // Create indexes
            await this.db.collection('pages').createIndex({ url: 1 }, { unique: true });
            await this.db.collection('links').createIndex({ from: 1, to: 1 }, { unique: true });

            // Initialize browser
            this.browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });

            // Initialize page pool
            for (let i = 0; i < this.config.maxConcurrent; i++) {
                const page = await this.browser.newPage();
                await page.setDefaultNavigationTimeout(30000);
                await page.setRequestInterception(true);
                
                page.on('request', request => {
                    if (request.resourceType() === 'image' || request.resourceType() === 'stylesheet' || request.resourceType() === 'font') {
                        request.abort();
                    } else {
                        request.continue();
                    }
                });

                this.pagePool.push({
                    page,
                    inUse: false,
                    lastUsed: 0
                });
            }

            console.log('HandbookScraper initialized successfully');
            console.log(`Configuration: Concurrent: ${this.config.maxConcurrent}`);
        } catch (error) {
            console.error('Failed to initialize scraper:', error);
            throw error;
        }
    }

    async loadProxies() {
        try {
            // Load proxies from environment or external service
            const proxyList = process.env.PROXY_LIST?.split(',') || [];
            this.proxies = proxyList.map(proxy => ({
                url: proxy,
                failCount: 0,
                lastUsed: 0,
                cooldown: false
            }));
            console.log(`Loaded ${this.proxies.length} proxies`);
        } catch (error) {
            console.error('Failed to load proxies:', error);
            throw error;
        }
    }

    getNextProxy() {
        if (!this.proxies.length) return null;
        
        // Filter out proxies on cooldown
        const availableProxies = this.proxies.filter(p => !p.cooldown);
        if (!availableProxies.length) return null;

        // Sort by fail count and last used time
        const sortedProxies = availableProxies.sort((a, b) => {
            if (a.failCount !== b.failCount) return a.failCount - b.failCount;
            return a.lastUsed - b.lastUsed;
        });

        const proxy = sortedProxies[0];
        proxy.lastUsed = Date.now();
        
        // Put proxy on cooldown after use
        proxy.cooldown = true;
        setTimeout(() => {
            proxy.cooldown = false;
        }, this.config.minDelay * 2);

        return proxy.url;
    }

    async getFreePage() {
        const now = Date.now();
        const page = this.pagePool.find(p => !p.inUse);
        
        if (page) {
            page.inUse = true;
            page.lastUsed = now;
            return page.page;
        }

        // If no free pages, wait and try again
        await setTimeout(1000);
        return this.getFreePage();
    }

    async releasePage(page) {
        const pageEntry = this.pagePool.find(p => p.page === page);
        if (pageEntry) {
            pageEntry.inUse = false;
            try {
                await page.goto('about:blank');
            } catch (error) {
                console.error('Error clearing page:', error);
            }
        }
    }

    async processUrl(url) {
        if (this.visited.has(url)) {
            console.log(`Skipping already visited URL: ${url}`);
            return;
        }
        
        console.log(`Processing URL: ${url}`);
        this.visited.add(url);

        const proxy = this.getNextProxy();
        let retries = 0;
        let page = null;

        while (retries < this.config.maxRetries) {
            try {
                // Random delay between requests
                const delay = Math.floor(
                    Math.random() * (this.config.maxDelay - this.config.minDelay) + 
                    this.config.minDelay
                );
                await setTimeout(delay);

                page = await this.getFreePage();
                if (proxy) {
                    await page.setExtraHTTPHeaders({
                        'X-Proxy': proxy
                    });
                }

                // Set user agent and other headers
                await page.setUserAgent(process.env.USER_AGENT || 'Mozilla/5.0 (compatible; HandbookBot/1.0; +http://example.com/bot)');
                
                console.log(`Fetching page: ${url}`);
                await page.goto(url, { 
                    waitUntil: 'networkidle0',
                    timeout: 30000
                });
                
                const content = await this.extractContent(page);
                console.log(`Extracted content from: ${url}`);
                
                // Store the content
                await this.db.collection('pages').updateOne(
                    { url },
                    { 
                        $set: {
                            content,
                            lastScraped: new Date()
                        }
                    },
                    { upsert: true }
                );

                // Extract and queue new links
                const links = await this.extractLinks(page);
                console.log(`Found ${links.length} links on ${url}`);
                
                let newLinks = 0;
                for (const link of links) {
                    if (!this.visited.has(link)) {
                        newLinks++;
                        await this.queueUrl(link);
                        await this.db.collection('links').updateOne(
                            { from: url, to: link },
                            { $set: { discovered: new Date() } },
                            { upsert: true }
                        );
                    }
                }
                console.log(`Queued ${newLinks} new links from ${url}`);

                await this.releasePage(page);
                break;
            } catch (error) {
                console.error(`Error processing ${url} (attempt ${retries + 1}):`, error.message);
                retries++;
                if (proxy) {
                    const proxyObj = this.proxies.find(p => p.url === proxy);
                    if (proxyObj) {
                        proxyObj.failCount++;
                        proxyObj.cooldown = true;
                        setTimeout(() => {
                            proxyObj.cooldown = false;
                        }, Math.pow(2, proxyObj.failCount) * 1000);
                    }
                }

                await this.db.collection('errors').insertOne({
                    url,
                    error: error.message,
                    timestamp: new Date(),
                    proxy
                });

                if (retries === this.config.maxRetries) {
                    console.error(`Failed to process ${url} after ${retries} retries`);
                }

                // Exponential backoff
                const backoffDelay = Math.pow(2, retries) * 1000;
                console.log(`Backing off for ${backoffDelay}ms before retry`);
                await setTimeout(backoffDelay);
            } finally {
                if (page) {
                    await this.releasePage(page);
                }
            }
        }
    }

    async extractContent(page) {
        return await page.evaluate(() => {
            // Remove unnecessary elements
            const elementsToRemove = document.querySelectorAll(
                'nav, footer, .sidebar, script, style, iframe, .announcement-bar'
            );
            elementsToRemove.forEach(el => el.remove());

            // Get main content
            const mainContent = document.querySelector('main') || document.body;
            
            // Extract text content with structure
            const extractStructuredContent = (element) => {
                const result = {
                    type: element.tagName.toLowerCase(),
                    content: ''
                };

                if (element.tagName === 'TABLE') {
                    result.content = element.outerHTML;
                } else if (element.tagName === 'IMG') {
                    result.content = element.src;
                    result.alt = element.alt;
                } else {
                    result.content = element.innerText.trim();
                }

                return result;
            };

            const content = Array.from(mainContent.children)
                .map(extractStructuredContent)
                .filter(item => item.content);

            return {
                title: document.title,
                content,
                metadata: {
                    lastModified: document.querySelector('meta[name="last-modified"]')?.content,
                    author: document.querySelector('meta[name="author"]')?.content
                }
            };
        });
    }

    async extractLinks(page) {
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a[href]'))
                .map(a => a.href)
                .filter(href => 
                    href.startsWith('https://handbook.mattermost.com') &&
                    !href.includes('#') // Exclude anchor links
                );
        });
        return [...new Set(links)]; // Remove duplicates
    }

    async queueUrl(url) {
        console.log(`Queueing URL: ${url}`);
        await this.queue.add(() => this.processUrl(url));
    }

    async start() {
        try {
            console.log('Initializing scraper...');
            await this.initialize();
            await this.loadProxies();
            
            console.log('Starting scraping from:', this.baseUrl);
            await this.queueUrl(this.baseUrl);
            
            // Wait for queue to complete
            console.log('Waiting for queue to complete...');
            await this.queue.onIdle();
            
            // Print final statistics
            const pageCount = await this.db.collection('pages').countDocuments();
            const linkCount = await this.db.collection('links').countDocuments();
            const errorCount = await this.db.collection('errors').countDocuments();
            
            console.log('\nScraping completed successfully');
            console.log('Final Statistics:');
            console.log(`- Pages scraped: ${pageCount}`);
            console.log(`- Links discovered: ${linkCount}`);
            console.log(`- Errors encountered: ${errorCount}`);
            
            await this.cleanup();
        } catch (error) {
            console.error('Scraping failed:', error);
            await this.cleanup();
            throw error;
        }
    }

    async cleanup() {
        // Clean up page pool
        for (const {page} of this.pagePool) {
            try {
                await page.close();
            } catch (e) {
                console.error('Error closing page:', e);
            }
        }
        this.pagePool = [];

        if (this.browser) {
            await this.browser.close();
        }
        if (this.db) {
            await this.db.client.close();
        }
    }
}

export default HandbookScraper;