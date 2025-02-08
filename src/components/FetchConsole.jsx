import React, { useState, useEffect } from 'react';

const FetchConsole = ({ isLoading, onCancel, onClose }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    if (isLoading) {
      const id = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setIntervalId(id);
    } else if (intervalId) {
      clearInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg shadow-lg w-[600px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm">Elapsed Time: {formatTime(elapsedTime)}</div>
          {isLoading && (
            <button
              onClick={onCancel}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Cancel
            </button>
          )}
        </div>
        
        <div className="border border-green-400 rounded p-3 h-[200px] overflow-y-auto font-mono text-sm">
          {isLoading ? (
            <>
              <div>Fetching data from Gemini API...</div>
              <div className="animate-pulse">▋</div>
            </>
          ) : (
            <div>Fetch completed successfully!</div>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 rounded ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default FetchConsole;