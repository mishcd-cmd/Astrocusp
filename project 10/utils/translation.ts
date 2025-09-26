// Simple translation service that won't conflict with forecast
export type SupportedLanguage = 'en' | 'zh';

// Simple translation function
export async function translateText(
  text: string, 
  targetLanguage: SupportedLanguage = 'en'
): Promise<string> {
  // Skip if English or empty
  if (targetLanguage === 'en' || !text.trim()) {
    return text;
  }

  try {
    console.log('[TRANSLATION] Translating:', text.substring(0, 50) + '...');
    
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY || process.env.GOOGLE_TRANSLATE_API_KEY;
    
    if (!apiKey) {
      console.error('[TRANSLATION] No API key found');
      return text;
    }
    
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: 'en',
        format: 'text',
      }),
    });

    if (!response.ok) {
      console.error('[TRANSLATION] API failed:', response.status);
      return text; // Return original on error
    }

    const result = await response.json();
    
    if (result.error) {
      console.error('[TRANSLATION] API error:', result.error);
      return text;
    }

    const translated = result.data?.translations?.[0]?.translatedText;
    
    if (translated) {
      console.log('[TRANSLATION] Success!');
      return translated;
    } else {
      console.log('[TRANSLATION] No translation returned');
      return text;
    }

  } catch (error) {
    console.error('[TRANSLATION] Error:', error);
    return text; // Always return original text on error
  }
}

// Get/set language preference (simplified)
export async function getUserLanguage(): Promise<SupportedLanguage> {
  try {
    // Try to get from local storage first
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('user_language');
      return (saved as SupportedLanguage) || 'en';
    }
    return 'en';
  } catch (error) {
    console.error('[TRANSLATION] Error getting language:', error);
    return 'en';
  }
}

export async function setUserLanguage(language: SupportedLanguage): Promise<void> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('user_language', language);
      console.log('[TRANSLATION] Language saved:', language);
    }
  } catch (error) {
    console.error('[TRANSLATION] Error saving language:', error);
  }
}

// Helper function to check if translation is needed
export function needsTranslation(language: SupportedLanguage): boolean {
  return language !== 'en';
}