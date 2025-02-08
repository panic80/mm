import React, { useState, useEffect } from 'react';

function Hero() {
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [lastScrapeTime, setLastScrapeTime] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check initial scraping status
    fetch('http://localhost:3001/api/scrape/status')
      .then(res => res.json())
      .then(data => {
        setIsScrapingInProgress(data.isScrapingInProgress);
        setLastScrapeTime(data.lastScrapeTime);
      })
      .catch(err => {
        console.error('Error fetching scrape status:', err);
        setError('Failed to fetch scraping status');
      });
  }, []);

  const handleScrape = async () => {
    try {
      setError(null);
      setIsScrapingInProgress(true);
      
      const response = await fetch('http://localhost:3001/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start scraping');
      }

      setLastScrapeTime(data.lastScrapeTime);
    } catch (err) {
      console.error('Error during scraping:', err);
      setError(err.message);
    } finally {
      setIsScrapingInProgress(false);
    }
  };

  return (
    <div className="hero pt-20">
      <h1 className="">Welcome to Our Chatbot</h1>
      <p>Get instant answers to your questions</p>
      
      <div className="mt-6 flex flex-col items-center">
        <button
          onClick={handleScrape}
          disabled={isScrapingInProgress}
          className={`px-4 py-2 rounded-md text-white ${
            isScrapingInProgress 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isScrapingInProgress ? 'Scraping in Progress...' : 'Fetch Data'}
        </button>
        
        {lastScrapeTime && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date(lastScrapeTime).toLocaleString()}
          </p>
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default Hero;
