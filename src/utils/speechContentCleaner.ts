
import { RiksdagSpeech } from '../services/riksdagApi';

export interface CleanedSpeechContent {
  content: string;
  source: 'html' | 'fallback' | 'error';
}

export const cleanSpeechContent = (rawContent: string, speech: RiksdagSpeech): CleanedSpeechContent => {
  // If we have raw HTML content, clean it up
  if (rawContent && rawContent.includes('<')) {
    const cleanedHtml = cleanHtmlContent(rawContent);
    return {
      content: cleanedHtml,
      source: 'html'
    };
  }
  
  // If we have plain text content
  if (rawContent && rawContent.length > 50) {
    return {
      content: `<p>${rawContent.replace(/\n/g, '</p><p>')}</p>`,
      source: 'html'
    };
  }
  
  // Fallback to speech data
  return createFallbackContent(speech);
};

export const createErrorContent = (speech: RiksdagSpeech, errorMessage: string): CleanedSpeechContent => {
  return {
    content: `
      <div class="error-content">
        <h3>${speech.titel}</h3>
        <p><strong>Talare:</strong> ${speech.talare}</p>
        <p><strong>Parti:</strong> ${speech.parti}</p>
        <p><strong>Datum:</strong> ${speech.datum}</p>
        <p><strong>Fel:</strong> ${errorMessage}</p>
        ${speech.anforande_text ? `<div class="speech-text">${speech.anforande_text}</div>` : ''}
      </div>
    `,
    source: 'error'
  };
};

const createFallbackContent = (speech: RiksdagSpeech): CleanedSpeechContent => {
  return {
    content: `
      <div class="fallback-content">
        <h3>${speech.titel}</h3>
        <p><strong>Talare:</strong> ${speech.talare}</p>
        <p><strong>Parti:</strong> ${speech.parti}</p>
        <p><strong>Datum:</strong> ${speech.datum}</p>
        ${speech.anforande_text ? `<div class="speech-text">${speech.anforande_text}</div>` : ''}
      </div>
    `,
    source: 'fallback'
  };
};

const cleanHtmlContent = (htmlContent: string): string => {
  // Remove script and style tags
  let cleaned = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gs, '')
    .replace(/<style[^>]*>.*?<\/style>/gs, '')
    .replace(/<link[^>]*>/gs, '')
    .replace(/<meta[^>]*>/gs, '');
  
  // Extract main content
  const contentMatch = cleaned.match(/<main[^>]*>(.*?)<\/main>/s) ||
                       cleaned.match(/<article[^>]*>(.*?)<\/article>/s) ||
                       cleaned.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s);
  
  if (contentMatch) {
    cleaned = contentMatch[1];
  }
  
  // Clean up remaining unwanted elements
  cleaned = cleaned
    .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
    .replace(/<header[^>]*>.*?<\/header>/gs, '')
    .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
    .replace(/<aside[^>]*>.*?<\/aside>/gs, '');
  
  return cleaned;
};
