import React, { useState, useEffect } from 'react';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState(0);

  const loadingMessages = [
    'Initializing application...',
    'Loading travel instructions...',
    'Preparing chat interface...',
    'Almost ready...'
  ];

  useEffect(() => {
    let intervalA = setInterval(() => {
      if (document.readyState === "interactive") {
        setProgress(prev => Math.min(prev + 0.5, 90));
      } else {
        setProgress(prev => Math.min(prev + 0.5, 60));
      }
    }, 50);

    const handleLoad = () => {
      clearInterval(intervalA);
      const intervalB = setInterval(() => {
         setProgress(prev => {
           if (prev < 100) {
             return Math.min(prev + 0.5, 100);
           } else {
             clearInterval(intervalB);
             return prev;
           }
         });
      }, 50);
    }

    window.addEventListener("load", handleLoad);

    return () => {
      clearInterval(intervalA);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  useEffect(() => {
    if (progress < 33) setLoadingPhase(0);
    else if (progress < 66) setLoadingPhase(1);
    else if (progress < 100) setLoadingPhase(2);
    else setLoadingPhase(3);
  }, [progress]);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* Main loading animation */}
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <svg className="loading-progress" viewBox="0 0 100 100">
            <circle
              className="loading-progress-circle"
              cx="50"
              cy="50"
              r="45"
              style={{
                strokeDasharray: `${progress * 2.83}, 283`
              }}
            />
          </svg>
        </div>

        {/* Loading text */}
        <h2 className="loading-title">Loading Travel Instructions</h2>
        <p className="loading-message">{loadingMessages[loadingPhase]}</p>
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="loading-percentage">{progress.toFixed(0)}%</p>

        {/* Skeleton screens */}
        <div className="loading-skeleton-container">
          <div className="loading-skeleton header"></div>
          <div className="loading-skeleton text"></div>
          <div className="loading-skeleton text short"></div>
          <div className="loading-skeleton text"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .loading-content {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
        }

        .loading-spinner-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 2rem;
        }

        .loading-spinner {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 10px solid var(--border);
          border-top-color: #ff0066;
          border-radius: 50%;
          animation: spin 1.5s ease-in-out infinite, colorChange 5s linear infinite;
          box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.3);
        }

        @keyframes colorChange {
          0% { border-top-color: #ff0066; }
          25% { border-top-color: #ff9900; }
          50% { border-top-color: #ffff00; }
          75% { border-top-color: #99ff00; }
          100% { border-top-color: #00ff99; }
        }

        .loading-progress {
          position: absolute;
          z-index: -1;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .loading-progress-circle {
          fill: none;
          stroke: var(--primary);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dasharray 0.3s ease;
        }

        .loading-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .loading-message {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          min-height: 1.5em;
          transition: opacity 0.3s ease;
        }

        .loading-progress-bar {
          width: 100%;
          height: 4px;
          background: var(--border);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .loading-progress-fill {
          height: 100%;
          background: var(--primary);
          transition: width 0.3s ease;
        }

        .loading-percentage {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 2rem;
        }

        .loading-skeleton-container {
          width: 100%;
          padding: 1rem;
          background: var(--background-secondary);
          border-radius: 8px;
        }

        .loading-skeleton {
          background: linear-gradient(
            90deg,
            var(--border) 25%,
            var(--background-secondary) 50%,
            var(--border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .loading-skeleton.header {
          height: 24px;
          width: 80%;
        }

        .loading-skeleton.text {
          height: 16px;
          width: 100%;
        }

        .loading-skeleton.short {
          width: 60%;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          from { background-position: 200% 0; }
          to { background-position: -200% 0; }
        }
      ` }} />
    </div>
  );
};

export default LoadingScreen;