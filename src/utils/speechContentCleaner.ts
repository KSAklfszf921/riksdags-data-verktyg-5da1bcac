export interface CleanedSpeechContent {
  content: string;
  hasRichContent: boolean;
  source: 'html' | 'fallback' | 'error';
}

export const cleanSpeechContent = (htmlContent: string, speech: any): CleanedSpeechContent => {
  try {
    // Remove problematic CSS and scripts
    let cleanedContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/body\s*\{[^}]*\}/g, '')
      .replace(/#page_\d+[^{]*\{[^}]*\}/g, '')
      .replace(/margin-top:\s*0px;/g, '')
      .replace(/margin-left:\s*0px;/g, '')
      .replace(/font-family:\s*[^;]+;/g, '')
      .replace(/font-size:\s*[^;]+;/g, '');

    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedContent, 'text/html');
    
    // Find the main speech content
    let speechElement = doc.querySelector('.anforande') || 
                       doc.querySelector('.text') || 
                       doc.querySelector('body') ||
                       doc.documentElement;

    if (speechElement) {
      // Clean up inline styles that might cause layout issues
      const allElements = speechElement.querySelectorAll('*');
      allElements.forEach(element => {
        if (element instanceof HTMLElement) {
          // Remove problematic styles but keep semantic formatting
          const style = element.style;
          style.removeProperty('margin-top');
          style.removeProperty('margin-left');
          style.removeProperty('font-family');
          style.removeProperty('font-size');
          style.removeProperty('position');
          style.removeProperty('top');
          style.removeProperty('left');
          
          // Clean up class names that might conflict
          if (element.className) {
            element.className = element.className
              .replace(/page_\d+/g, '')
              .replace(/margin\w*/g, '')
              .trim();
          }
        }
      });

      const finalContent = speechElement.innerHTML;
      
      // Check if we have meaningful content
      const textContent = speechElement.textContent?.trim() || '';
      if (textContent.length > 50) {
        return {
          content: finalContent,
          hasRichContent: true,
          source: 'html'
        };
      }
    }

    // If we couldn't extract good content, fall back to basic info
    return createFallbackContent(speech);

  } catch (error) {
    console.error('Error cleaning speech content:', error);
    return createFallbackContent(speech);
  }
};

const createFallbackContent = (speech: any): CleanedSpeechContent => {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const fallbackHtml = `
    <div class="speech-fallback p-4 bg-gray-50 rounded-lg">
      <h4 class="text-lg font-semibold mb-3 text-gray-900">${speech.dok_titel || 'Anförande'}</h4>
      <div class="space-y-2 text-sm">
        <p><span class="font-medium text-gray-700">Talare:</span> <span class="text-gray-900">${speech.talare}</span></p>
        <p><span class="font-medium text-gray-700">Parti:</span> <span class="text-gray-900">${speech.parti}</span></p>
        <p><span class="font-medium text-gray-700">Datum:</span> <span class="text-gray-900">${formatDate(speech.anforandedatum)}</span></p>
        <p><span class="font-medium text-gray-700">Kammaraktivitet:</span> <span class="text-gray-900">${speech.kammaraktivitet}</span></p>
        ${speech.anforandetext ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <p class="font-medium text-gray-700 mb-2">Anförandetext:</p>
            <div class="text-gray-900 leading-relaxed">${speech.anforandetext}</div>
          </div>
        ` : ''}
      </div>
      <div class="mt-4 pt-3 border-t border-gray-200">
        <p class="text-xs text-gray-600">Fullständigt innehåll kunde inte laddas. </p>
      </div>
    </div>
  `;

  return {
    content: fallbackHtml,
    hasRichContent: false,
    source: 'fallback'
  };
};

export const createErrorContent = (speech: any, error?: string): CleanedSpeechContent => {
  const errorHtml = `
    <div class="speech-error p-4 bg-red-50 border border-red-200 rounded-lg">
      <h4 class="text-lg font-semibold mb-2 text-red-800">Kunde inte ladda anförande</h4>
      <p class="text-red-700 mb-3">${error || 'Ett oväntat fel inträffade när anförandets innehåll skulle laddas.'}</p>
      <div class="space-y-2">
        <a 
          href="${speech.protokoll_url_www || '#'}" 
          target="_blank" 
          rel="noopener noreferrer"
          class="inline-flex items-center text-blue-600 hover:text-blue-800 underline"
        >
          Öppna i riksdagens webbplats
        </a>
      </div>
    </div>
  `;

  return {
    content: errorHtml,
    hasRichContent: false,
    source: 'error'
  };
};
