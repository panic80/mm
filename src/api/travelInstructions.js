// Cache implementation with IndexedDB for better performance and offline support
const DB_NAME = 'travel-instructions-cache';
const STORE_NAME = 'instructions';
const CACHE_KEY = 'travel-data';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize IndexedDB with robust error handling and version management
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Get cached data from IndexedDB with timestamp validation and error recovery
const getCachedData = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result;
        if (data && (Date.now() - data.timestamp < CACHE_DURATION)) {
          resolve(data.content);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error('Error accessing cache:', error);
    return null;
  }
};

// Store data in IndexedDB with comprehensive error handling
const setCachedData = async (content) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({
        content,
        timestamp: Date.now()
      }, CACHE_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Error updating cache:', error);
  }
};

// Memory cache for ultra-fast access during active sessions
let memoryCache = null;
let memoryCacheTimestamp = 0;
let isInitializing = false;
let initializationPromise = null;

// Main function to fetch travel instructions with better initialization handling
export const fetchTravelInstructions = async () => {
  // If already initializing, wait for that to complete
  if (isInitializing) {
    return initializationPromise;
  }

  // Check memory cache first
  if (memoryCache && (Date.now() - memoryCacheTimestamp < CACHE_DURATION)) {
    return memoryCache;
  }

  try {
    isInitializing = true;
    initializationPromise = (async () => {
      // Try IndexedDB cache first
      const cachedData = await getCachedData();
      if (cachedData) {
        memoryCache = cachedData;
        memoryCacheTimestamp = Date.now();
        return cachedData;
      }

      // Fetch from server
      console.log('Fetching fresh travel instructions...');
      const response = await fetch('/api/travel-instructions');
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      if (!data.content) {
        throw new Error('Invalid response format from server');
      }

      const instructions = data.content
        .split('\n')
        .filter(line => line.trim().length > 0)
        .join('\n');

      // Update caches
      memoryCache = instructions;
      memoryCacheTimestamp = Date.now();
      await setCachedData(instructions);

      return instructions;
    })();

    return await initializationPromise;
  } catch (error) {
    console.error('Error fetching travel instructions:', error);
    if (memoryCache) {
      return memoryCache;
    }
    throw new Error('Travel instructions are being loaded. Please try again in a moment.');
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};
