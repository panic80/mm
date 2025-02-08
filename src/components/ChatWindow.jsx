import React, { useRef, useEffect, useState, useCallback } from 'react';
import { marked } from 'marked';
import { useGesture } from '@use-gesture/react';

function ChatWindow({ messages, isLoading, isTyping, onRefresh, isSimplifyMode }) {
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [swipedMessageId, setSwipedMessageId] = useState(null);
  
  marked.setOptions({
    breaks: true,
    highlight: function(code, lang) {
      return `<div class="code-block">
        <div class="code-header">
          <span>${lang || 'Code'}</span>
        </div>
        <pre><code>${code}</code></pre>
      </div>`;
    }
  });

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior });
      }, 50);
    }
  };

  // Pull to refresh handler
  const handlePull = useCallback(({ movement: [_, y], cancel, canceled, active }) => {
    if (canceled) return;

    const maxPull = 150;
    const progress = Math.min(Math.max(y, 0), maxPull) / maxPull;
    setPullProgress(progress);

    if (!active && progress > 0.5) {
      setRefreshing(true);
      onRefresh?.().finally(() => {
        setRefreshing(false);
        setPullProgress(0);
      });
    } else if (!active) {
      setPullProgress(0);
    }
  }, [onRefresh]);

  // Message swipe handler
  const handleMessageSwipe = useCallback(({ args: [messageId], movement: [x], active }) => {
    const threshold = 80;
    if (active) {
      setSwipedMessageId(messageId);
    } else if (Math.abs(x) > threshold) {
      // Show action menu
      setSwipedMessageId(null);
    } else {
      setSwipedMessageId(null);
    }
  }, []);

  // Setup gestures
  const bind = useGesture({
    onDrag: handlePull,
  }, {
    filterTaps: true,
    from: () => [0, 0],
  });

  const bindMessage = useGesture({
    onDrag: handleMessageSwipe,
  }, {
    filterTaps: true,
    axis: 'x',
  });

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    const chatWindow = chatWindowRef.current;
    if (!chatWindow) return;

    const isScrolledToBottom =
      chatWindow.scrollHeight - chatWindow.clientHeight <= chatWindow.scrollTop + 30;

    const isNewMessage = messages.length > 0 &&
      (messages[messages.length - 1]?.type === 'user' ||
       messages[messages.length - 1]?.type === 'bot');

    if (isScrolledToBottom || isNewMessage) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle loading and typing states
  useEffect(() => {
    if (isLoading || isTyping) {
      scrollToBottom();
    }
  }, [isLoading, isTyping]);

  const groupMessages = (msgs) => {
    const groups = [];
    let currentGroup = [];
    let lastType = null;

    msgs.forEach((msg) => {
      if (!lastType || msg.type !== lastType) {
        if (currentGroup.length) {
          groups.push(currentGroup);
        }
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
      lastType = msg.type;
    });

    if (currentGroup.length) {
      groups.push(currentGroup);
    }

    return groups;
  };

  const messageGroups = groupMessages(messages);

  return (
    <main
      {...bind()}
      ref={chatWindowRef}
      className={`chat-window ${refreshing ? 'refreshing' : ''}`}
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
      style={{
        '--pull-progress': pullProgress,
      }}
    >
      <div className="pull-indicator" aria-hidden="true">
        {refreshing ? 'Refreshing...' : 'Pull to refresh'}
      </div>

      {messageGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="message-group"
        >
          {group.map((msg, i) => (
            <article
              key={i}
              {...bindMessage(msg.id)}
              className={`message ${msg.type} ${msg.status || ''} ${swipedMessageId === msg.id ? 'swiped' : ''}`}
              role={msg.type === 'user' ? 'complementary' : 'article'}
              aria-label={`${msg.type === 'user' ? 'Your message' : 'Assistant response'}`}
            >
              <>
                {msg.simplified && msg.type === 'bot' && (
                  <div className="simplified-label" role="status" aria-label="Simplified Answer">
                    Simplified Answer
                  </div>
                )}
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(msg.text.replace(/\n/g, '  \n'))
                  }}
                  role="region"
                />
              </>
              {msg.sources && msg.sources.length > 0 && (
                <div className="message-sources" role="complementary" aria-label="Reference sources">
                  {msg.sources.map((source, index) => (
                    <div key={index} className="source-item">
                      {source.reference && (
                        <small className="source-reference">
                          Reference: {source.reference}
                        </small>
                      )}
                      {source.text && (
                        <small className="source-quote">
                          Quote: {source.text}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ))}
      {isLoading && (
        <div
          className="message loading-message"
          role="status"
          aria-label="Loading response"
        >
          <div className="message-content">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} tabIndex="-1" />
    </main>
  );
}

export default ChatWindow;
