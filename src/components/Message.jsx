import React from 'react';
import { marked } from 'marked';

const Message = ({ msg, swiped, bindSwipe }) => (
  <article
    {...bindSwipe(msg.id)}
    className={`message ${msg.type} ${msg.status || ''} ${swiped ? 'swiped' : ''}`}
    role={msg.type === 'user' ? 'complementary' : 'article'}
    aria-label={msg.type === 'user' ? 'Your message' : 'Assistant response'}
  >
    {msg.simplified && msg.type === 'bot' && (
      <div className="simplified-label" role="status" aria-label="Simplified Answer">
        Simplified Answer
      </div>
    )}
    <div
      className="message-content"
      dangerouslySetInnerHTML={{ __html: marked.parse(msg.text.replace(/\n/g, '  \n')) }}
      role="region"
    />
    {msg.sources && msg.sources.length > 0 && (
      <div className="message-sources" role="complementary" aria-label="Reference sources">
        {msg.sources.map((source, index) => (
          <div key={index} className="source-item">
            {source.reference && (
              <small className="source-reference">Reference: {source.reference}</small>
            )}
            {source.text && (
              <small className="source-quote">Quote: {source.text}</small>
            )}
          </div>
        ))}
      </div>
    )}
  </article>
);

export default Message;