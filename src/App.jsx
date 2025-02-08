import React, { useState, useEffect, lazy, Suspense, startTransition } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { sendToGemini } from './api/gemini.jsx';
import { fetchTravelInstructions } from './api/travelInstructions';
import { addQuestion } from './api/questionAnalysis';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

// Lazy load components
const Sidebar = lazy(() => import('./components/Sidebar'));
const Hero = lazy(() => import('./components/Hero'));
const ChatWindow = lazy(() => import('./components/ChatWindow'));
const ChatInput = lazy(() => import('./components/ChatInput'));
const ThemeToggle = lazy(() => import('./components/ThemeToggle'));
const MobileNavBar = lazy(() => import('./components/MobileNavBar'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Prefetch components
const prefetchComponent = (importFn) => {
  const prefetchTimeoutId = setTimeout(() => {
    importFn().catch(() => {});
  }, 2000);
  return () => clearTimeout(prefetchTimeoutId);
};

function App() {
  // State management with batching
  const [state, setState] = useState({
    isPreloading: true,
    travelInstructions: null,
    input: '',
    theme: 'dark',
    sidebarCollapsed: false,
    isMobile: false,
    isLoading: false,
    isTyping: false,
    typingTimeout: null,
    isFirstInteraction: true,
    isSimplified: false,
    model: 'models/gemini-2.0-flash-001'
  });

  const [messages, setMessages] = useState([
    {
      text: "Welcome! I'm here to help answer your questions about the Canadian Forces Temporary Duty Travel Instructions. What would you like to know?",
      type: 'bot',
      sources: [],
      simplified: false
    }
  ]);

  // Prefetch components on mount
  useEffect(() => {
    const cleanupFns = [
      prefetchComponent(() => import('./components/Sidebar')),
      prefetchComponent(() => import('./components/Hero')),
      prefetchComponent(() => import('./components/ChatWindow')),
      prefetchComponent(() => import('./components/ChatInput')),
      prefetchComponent(() => import('./components/MobileToggle'))
    ];
    return () => cleanupFns.forEach(cleanup => cleanup());
  }, []);

  // Preload data
  useEffect(() => {
    const preloadData = async () => {
      try {
        const data = await fetchTravelInstructions();
        startTransition(() => {
          setState(prev => ({
            ...prev,
            travelInstructions: data,
            isPreloading: false
          }));
        });
      } catch (error) {
        console.error('Error preloading travel instructions:', error);
        setState(prev => ({ ...prev, isPreloading: false }));
      }
    };

    preloadData();
  }, []);

  // Theme and mobile updates
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', state.theme);
    root.setAttribute('data-mobile', state.manualMobileToggle || state.isMobile);
    
    // Force a repaint to ensure theme changes are applied immediately
    root.style.display = 'none';
    root.offsetHeight; // Trigger reflow
    root.style.display = '';
  }, [state.theme, state.manualMobileToggle, state.isMobile]);

  // Resize handler with debounce
  useEffect(() => {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        setState(prev => ({ ...prev, isMobile: window.innerWidth <= 768 }));
      }, 150);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // Message handling with optimized state updates
  const handleSend = async () => {
    if (!state.input.trim()) return;

    setState(prev => ({ ...prev, isLoading: true }));
    const userMessage = { text: state.input, type: 'user' };
    
    startTransition(() => {
      setMessages(prev => [...prev, userMessage]);
      setState(prev => ({
        ...prev,
        input: '',
        isFirstInteraction: false
      }));
    });

    try {
      if (!state.travelInstructions) {
        throw new Error('Travel instructions not loaded yet. Please try again in a moment.');
      }

      // Track the question for FAQ analysis and trigger update
      await addQuestion(state.input);
      window.dispatchEvent(new Event('questionAdded'));

      const response = await sendToGemini(
        state.input,
        state.isSimplified,
        state.model,
        state.travelInstructions
      );
      
      startTransition(() => {
        setMessages(prev => [
          ...prev,
          {
            text: response.text,
            type: 'bot',
            sources: response.sources,
            simplified: state.isSimplified
          }
        ]);
      });
    } catch (error) {
      console.error('Chat Error:', {
        message: error.message,
        stack: error.stack
      });
      
      startTransition(() => {
        setMessages(prev => [
          ...prev,
          {
            text: `Error: ${error.message}`,
            type: 'bot',
            sources: []
          }
        ]);
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Typing indicator with debounce
  const handleTyping = () => {
    if (state.isFirstInteraction) return;

    if (!state.isTyping) {
      setState(prev => ({ ...prev, isTyping: true }));
    }
    
    if (state.typingTimeout) {
      clearTimeout(state.typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      setState(prev => ({ ...prev, isTyping: false }));
    }, 1000);
    
    setState(prev => ({ ...prev, typingTimeout: timeout }));
  };

  return (
    <Router>
      <div className="w-screen min-h-screen overflow-x-hidden overflow-y-auto m-0 p-0 max-w-[100vw]">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<LoadingScreen />}>
                <LandingPage />
              </Suspense>
            } />
            <Route
              path="/chat"
              element={
                state.isPreloading ? (
                  <LoadingScreen />
                ) : (
                  <div className="flex">
                    {!state.isMobile && (
                      <Sidebar
                        theme={state.theme}
                        toggleTheme={() => setState(prev => ({
                          ...prev,
                          theme: prev.theme === 'light' ? 'dark' : 'light'
                        }))}
                        sidebarCollapsed={state.sidebarCollapsed}
                        toggleSidebar={() => setState(prev => ({
                          ...prev,
                          sidebarCollapsed: !prev.sidebarCollapsed
                        }))}
                      />
                    )}
                    <div className="flex-1">
                     <ThemeToggle
                       theme={state.theme}
                       toggleTheme={() => setState(prev => ({
                         ...prev,
                         theme: prev.theme === 'light' ? 'dark' : 'light'
                       }))}
                     />
                     <div className="main-content">
                       <div className="content-wrapper">
                         <Hero />
                         <ChatWindow
                           messages={messages}
                           isLoading={state.isLoading}
                           isTyping={state.isTyping}
                           isSimplifyMode={state.isSimplified}
                         />
                       </div>
                       <div className="chat-input-container">
                         <ChatInput
                           input={state.input}
                           setInput={(input) => setState(prev => ({ ...prev, input }))}
                           handleSend={handleSend}
                           isLoading={state.isLoading}
                           isSimplified={state.isSimplified}
                           setIsSimplified={(isSimplified) => setState(prev => ({
                             ...prev,
                             isSimplified
                           }))}
                           model={state.model}
                           setModel={(model) => setState(prev => ({ ...prev, model }))}
                           onTyping={handleTyping}
                           theme={state.theme}
                         />
                       </div>
                     </div>
                   </div>
                 </div>
               )
             }
           />
            <Route path="/privacy" element={
                          <Suspense fallback={<LoadingScreen />}>
                            <PrivacyPage />
                          </Suspense>
                        } />
            <Route path="/faq" element={
              <Suspense fallback={<LoadingScreen />}>
                <FAQPage />
              </Suspense>
            } />
            <Route path="/coming-soon-1" element={
              <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon</h1>
              </div>
            } />
            <Route path="/coming-soon-2" element={
              <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Coming Soon</h1>
              </div>
            } />
          </Routes>
          {state.isMobile && (
            <MobileNavBar
              theme={state.theme}
              toggleTheme={() => setState(prev => ({
                ...prev,
                theme: prev.theme === 'light' ? 'dark' : 'light'
              }))}
            />
          )}
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
