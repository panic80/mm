const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const sendToGemini = async (
  message,
  isSimplified = false,
  model = 'gemini-pro',
  signal = null
) => {
  try {
    // Prepare request body
    const requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: `You are a helpful assistant for Canadian Forces Handbook.

Question: ${message}

Please provide a response in this EXACT format:

Reference: <provide the section or chapter reference>
Quote: <provide the exact quote that contains the answer>
${isSimplified ?
  'Answer: <provide a concise answer in no more than two sentences>' :
  'Answer: <provide a succinct one-sentence reply>\nReason: <provide a comprehensive explanation and justification>'}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topP: 0.1,
        topK: 1,
        maxOutputTokens: 2048
      }
    };

    // Make API request with retry logic
    const response = await fetch(
      `/api/gemini/generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Gemini API');
    }

    const data = await response.json();
    console.log('Gemini API Response:', JSON.stringify(data, null, 2));

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const text = data.candidates[0].content.parts[0].text;
    const sections = text.split('\n').filter(line => line.trim());
    
    const reference = sections.find(line => line.startsWith('Reference:'))?.replace('Reference:', '').trim();
    const quote = sections.find(line => line.startsWith('Quote:'))?.replace('Quote:', '').trim();
    const answer = sections.find(line => line.startsWith('Answer:'))?.replace('Answer:', '').trim();
    const reason = sections.find(line => line.startsWith('Reason:'))?.replace('Reason:', '').trim();

    if (!answer) {
      throw new Error('Response missing required answer section');
    }

    const formattedText = isSimplified ? answer : (reason ? `${answer}\n\nReason: ${reason}` : answer);
    const responseData = {
      text: formattedText,
      sources: quote ? [{ text: quote, reference }] : []
    };

    return responseData;

  } catch (error) {
    console.error('Gemini API Error:', {
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
};
