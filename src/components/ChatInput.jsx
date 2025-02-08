import React, { useRef, useEffect } from 'react';

function ChatInput({ input, setInput, handleSend, onTyping, isLoading, isSimplified, setIsSimplified, theme }) {
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus input on component mount
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    };

    adjustHeight();
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [input]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    onTyping && onTyping();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSend();
      }
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData?.getData('text/plain');
    e.preventDefault();
    const cursorPos = e.target.selectionStart;
    const newValue = input.slice(0, cursorPos) + text + input.slice(cursorPos);
    setInput(newValue);
    onTyping && onTyping();
  };

  return (
    <div className="chat-input relative" role="form" aria-label="Chat message input">
      <label htmlFor="message-input" className="sr-only">Type your message</label>
      <div className="input-wrapper flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setIsSimplified(!isSimplified)}
          className={`simplify-toggle inline-flex items-center gap-3 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
            theme === 'dark'
              ? 'bg-[#2A3441] text-white/90 hover:bg-[#323D4D] border border-white/20'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }`}
          aria-pressed={isSimplified}
          aria-label={`${isSimplified ? 'Disable' : 'Enable'} simplified responses`}
        >
          <div className="relative w-11 h-6 transition-colors duration-200 ease-in-out rounded-full border border-transparent flex items-center">
            <div
              className={`${
                isSimplified ? 'translate-x-5 bg-primary' : 'translate-x-0.5'
              } pointer-events-none h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                theme === 'dark'
                  ? isSimplified ? 'bg-primary' : 'bg-white/90'
                  : isSimplified ? 'bg-primary' : 'bg-gray-400'
              }`}
            />
            <div className={`absolute inset-0 rounded-full ${
              isSimplified
                ? 'bg-primary/30'
                : theme === 'dark'
                  ? 'bg-white/30'
                  : 'bg-gray-200'
            }`} />
          </div>
          <span className={`${isSimplified ? (theme === 'dark' ? 'text-white font-medium' : 'text-primary font-medium') : ''}`}>Simplify</span>
        </button>
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            id="message-input"
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            onPaste={handlePaste}
            placeholder="Type your message..."
            aria-label="Message input"
            rows={1}
            style={{ height: '52px', minHeight: '52px', maxHeight: '120px' }}
            className={`w-full resize-none overflow-hidden rounded-xl border ${
              theme === 'dark'
                ? 'bg-[#1e2330] text-white border-border/30 hover:bg-[#252b3b] focus:bg-[#1e2330]'
                : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50 focus:bg-white'
            } shadow-sm px-4 py-3.5 text-base placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:shadow-md hover:border-border/50 hover:shadow transition-all duration-200 ease-in-out disabled:opacity-50`}
            disabled={isLoading}
          />
        </div>
        <button
          onClick={handleSend}
          aria-label="Send message"
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`h-[52px] w-[52px] rounded-xl bg-primary text-white transition-all hover:bg-primary-hover disabled:opacity-50 ${isLoading ? 'loading' : ''} inline-flex items-center justify-center`}
        >
          {isLoading ? (
            <div className="loading-dots relative w-5 h-5">
              <span className="absolute inset-0 animate-ping-slow rounded-full bg-white/80 opacity-75"></span>
              <span className="absolute inset-0.5 rounded-full bg-white"></span>
            </div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
