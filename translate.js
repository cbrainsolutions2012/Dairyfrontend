import axios from 'axios';

export const translateText = async (text, targetLang = 'mr') => {
  try {
    const response = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'en',
        target: targetLang,
        format: 'text'
      },
      {
        headers: { accept: 'application/json' }
      }
    );
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};
