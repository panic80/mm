import React from 'react';
import TopFAQs from '../components/TopFAQs';

const FAQPage = () => {
  return (
    <div className="main-content">
        <div className="content-wrapper">
          <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
          <TopFAQs visible={true} />
        </div>
    </div>
  );
};

export default FAQPage;