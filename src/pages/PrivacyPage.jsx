import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="theme-wrapper">
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'var(--background)', color: 'var(--text)' }}>
        <div className="max-w-3xl mb-8">
          <h1 className="text-3xl font-bold mb-4">Privacy Disclaimer</h1>
          <p className="text-lg mb-2">
            We value your privacy. This application collects minimal personal information required for policy assistance. All information provided is used solely for the purpose of delivering personalized services.
          </p>
          <p className="text-lg mb-2">
            By using this service, you consent to our privacy practices, which may include the collection, storage, and transmission of personal information as described.
          </p>
          <p className="text-lg mb-2">
            We will not share your data with third parties without your explicit consent, except as required by law.
          </p>
          <p className="text-lg mb-4">
            Please review our complete Privacy Policy for more detailed information. If you have any questions, please contact support.
          </p>
          <h2 className="text-2xl font-semibold mb-2">Data Retention Summary</h2>
          <p className="text-lg mb-2">
            For your personal account, your Gemini interactions—including prompts and conversations—are saved by default for up to 18 months. You can adjust this setting in your account to retain your data for only 3 months or extend it up to 36 months.
          </p>
          <p className="text-lg">
            Additionally, even if you opt out of detailed activity tracking, temporary records may be maintained for up to 72 hours to keep the service running smoothly. These records are not visible in your activity log and can be manually deleted at any time.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}