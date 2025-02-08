import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the main landing page
app.use(express.static(path.join(__dirname, '../public_html')));

// Serve the React app under /chatbot path
app.use('/chatbot', express.static(path.join(__dirname, '../dist')));

// Proxy setup for the backend server (from proxy.js)
app.use('/api', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
}));

// Handle React app routes
app.get('/chatbot/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Handle 404s
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../public_html/index.html'));
});

//app.listen(PORT, () => {
//    console.log(`Server running on port ${PORT}`);
//});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
