import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ExternalLink, FileText, Calendar, Building, Hash, Loader2, AlertCircle } from 'lucide-react';
import { RiksdagDocument } from '../services/riksdagApi';

interface DocumentViewerProps {
  document: RiksdagDocument;
}

const DocumentViewer = ({ document }: DocumentViewerProps) => {
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Förbättrad URL-konstruktion för att försöka flera format
      const urls = [];
      
      // Lägg till direktlänkar om de finns
      if (document.dokument_url_html) {
        const htmlUrl = document.dokument_url_html.startsWith('//') 
          ? `https:${document.dokument_url_html}` 
          : document.dokument_url_html;
        urls.push(htmlUrl);
      }
      
      if (document.dokument_url_text) {
        const textUrl = document.dokument_url_text.startsWith('//') 
          ? `https:${document.dokument_url_text}` 
          : document.dokument_url_text;
        urls.push(textUrl);
      }
      
      // Konstruera URLs baserat på beteckning
      if (document.beteckning) {
        const beteckning = document.beteckning.replace(/\s+/g, '');
        urls.push(`https://data.riksdagen.se/dokument/${beteckning}.html`);
        urls.push(`https://data.riksdagen.se/dokument/${beteckning}`);
        urls.push(`https://data.riksdagen.se/dokument/${beteckning}/text`);
      }
      
      console.log('Trying URLs:', urls);
      
      let content = '';
      let fetchError = null;
      
      // Försök hämta från varje URL tills vi får meningsfullt innehåll
      for (const url of urls) {
        try {
          console.log('Fetching from:', url);
          const response = await fetch(url);
          
          if (!response.ok) {
            console.log(`Failed to fetch from ${url}: ${response.status}`);
            continue;
          }
          
          let rawContent = await response.text();
          console.log(`Content length from ${url}:`, rawContent.length);
          
          // Extrahera innehåll baserat på format
          let extractedContent = '';
          if (rawContent.includes('<!DOCTYPE html>') || rawContent.includes('<html')) {
            extractedContent = extractContentFromHTML(rawContent);
          } else if (rawContent.includes('<?xml') || rawContent.includes('<dokument>')) {
            extractedContent = extractContentFromXML(rawContent);
          } else {
            extractedContent = rawContent;
          }
          
          // Kontrollera om vi fick meningsfullt innehåll (inte bara metadata)
          const cleanedContent = cleanAndFormatContent(extractedContent);
          console.log('Cleaned content length:', cleanedContent.length);
          console.log('Content preview:', cleanedContent.substring(0, 200));
          
          // Om innehållet ser ut som riktig text (inte bara metadata), använd det
          if (cleanedContent.length > 200 && !isOnlyMetadata(cleanedContent)) {
            content = cleanedContent;
            console.log('Found good content from:', url);
            break;
          }
          
        } catch (err) {
          console.error(`Error fetching from ${url}:`, err);
          fetchError = err;
        }
      }
      
      if (!content || isOnlyMetadata(content)) {
        throw new Error('Kunde inte extrahera dokumentinnehåll från någon av källorna');
      }
      
      setDocumentContent(content);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Okänt fel vid hämtning av dokument');
    } finally {
      setLoading(false);
    }
  };

  const extractContentFromHTML = (htmlContent: string): string => {
    // Förbättrad HTML-extraktion för olika dokumenttyper
    let content = '';
    
    // Försök hitta huvud-innehållsområdet
    const contentSelectors = [
      // Motioner och propositioner
      /<div[^>]*class="[^"]*dokument-text[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*main[^"]*"[^>]*>(.*?)<\/div>/s,
      /<main[^>]*>(.*?)<\/main>/s,
      
      // Specifika sektioner för motioner
      /<div[^>]*class="[^"]*motion[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*proposal[^"]*"[^>]*>(.*?)<\/div>/s,
      
      // Fallback: body innehåll utan header/footer/nav
      /<body[^>]*>(.*?)<\/body>/s
    ];
    
    for (const regex of contentSelectors) {
      const match = htmlContent.match(regex);
      if (match && match[1]) {
        content = match[1];
        console.log('Found content with selector:', regex.source.substring(0, 50) + '...');
        
        // Rensa bort navigation, footer, header etc.
        content = removeNavigationElements(content);
        
        // Om vi hittat betydande innehåll, använd det
        if (content.length > 500) {
          break;
        }
      }
    }
    
    // Om vi fortfarande inte har bra innehåll, ta hela body:n och rensa
    if (!content || content.length < 200) {
      const bodyMatch = htmlContent.match(/<body[^>]*>(.*?)<\/body>/s);
      if (bodyMatch) {
        content = removeNavigationElements(bodyMatch[1]);
      }
    }
    
    return content;
  };

  const removeNavigationElements = (content: string): string => {
    return content
      // Ta bort navigation, header, footer
      .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
      .replace(/<header[^>]*>.*?<\/header>/gs, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
      .replace(/<aside[^>]*>.*?<\/aside>/gs, '')
      
      // Ta bort menyer och breadcrumbs
      .replace(/<div[^>]*class="[^"]*menu[^"]*"[^>]*>.*?<\/div>/gs, '')
      .replace(/<div[^>]*class="[^"]*breadcrumb[^"]*"[^>]*>.*?<\/div>/gs, '')
      .replace(/<div[^>]*class="[^"]*navigation[^"]*"[^>]*>.*?<\/div>/gs, '')
      
      // Ta bort metadata-block som ofta är i början
      .replace(/<div[^>]*class="[^"]*metadata[^"]*"[^>]*>.*?<\/div>/gs, '')
      .replace(/<div[^>]*class="[^"]*document-info[^"]*"[^>]*>.*?<\/div>/gs, '')
      
      // Ta bort script och style
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<style[^>]*>.*?<\/style>/gs, '');
  };

  const extractContentFromXML = (xmlContent: string): string => {
    // Förbättrad XML-extraktion
    const xmlSelectors = [
      // Huvudinnehåll
      /<dokinttext[^>]*>(.*?)<\/dokinttext>/s,
      /<text[^>]*>(.*?)<\/text>/s,
      /<dokument[^>]*>(.*?)<\/dokument>/s,
      
      // Motionsspecifika
      /<motion[^>]*>(.*?)<\/motion>/s,
      /<proposal[^>]*>(.*?)<\/proposal>/s,
      
      // Fallback
      /<summary[^>]*>(.*?)<\/summary>/s,
      /<notis[^>]*>(.*?)<\/notis>/s
    ];
    
    for (const regex of xmlSelectors) {
      const match = xmlContent.match(regex);
      if (match && match[1] && match[1].trim().length > 100) {
        console.log('Found XML content with selector:', regex.source.substring(0, 30) + '...');
        return match[1];
      }
    }
    
    return xmlContent;
  };

  const isOnlyMetadata = (content: string): boolean => {
    // Kontrollera om innehållet bara är metadata
    const metadataIndicators = [
      // Datum och ID-mönster
      /^\d{4}-\d{2}-\d{2}\s*\d+\s*[A-Z]{2,5}\s*\d+/,
      
      // Många korta rader med teknisk info
      /^[\s\d\-:]+[A-Z]{2,10}[\s\d\-:]+$/m,
      
      // Bara beteckningar och datum
      /^[A-Z]{1,3}\d{6}\s*\d{4}\/\d{2}:\d+/,
    ];
    
    // Om innehållet matchar metadata-mönster och är kort
    if (content.length < 500) {
      for (const indicator of metadataIndicators) {
        if (indicator.test(content.trim())) {
          console.log('Content appears to be only metadata');
          return true;
        }
      }
    }
    
    // Om innehållet mestadels består av datum, siffror och korta ord
    const words = content.trim().split(/\s+/);
    const shortWords = words.filter(word => word.length <= 3 || /^\d+$/.test(word) || /^\d{4}-\d{2}-\d{2}$/.test(word));
    const shortWordRatio = shortWords.length / words.length;
    
    if (shortWordRatio > 0.7 && content.length < 1000) {
      console.log('Content has high ratio of short words/numbers, likely metadata');
      return true;
    }
    
    return false;
  };

  const cleanAndFormatContent = (content: string): string => {
    return content
      // Rensa HTML-taggar men behåll struktur
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<banner[^>]*>.*?<\/banner>/gs, '')
      .replace(/<nav[^>]*>.*?<\/nav>/gs, '')
      .replace(/<header[^>]*>.*?<\/header>/gs, '')
      .replace(/<footer[^>]*>.*?<\/footer>/gs, '')
      .replace(/<a[^>]*href="[^"]*"[^>]*>/g, '')
      .replace(/<\/a>/g, '')
      .replace(/<img[^>]*>/g, '')
      
      // Ersätt HTML-entiteter
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&ouml;/g, 'ö')
      .replace(/&auml;/g, 'ä')
      .replace(/&aring;/g, 'å')
      .replace(/&Ouml;/g, 'Ö')
      .replace(/&Auml;/g, 'Ä')
      .replace(/&Aring;/g, 'Å')
      .replace(/&eacute;/g, 'é')
      .replace(/&aacute;/g, 'á')
      .replace(/&iacute;/g, 'í')
      .replace(/&oacute;/g, 'ó')
      .replace(/&uacute;/g, 'ú')
      .replace(/&ntilde;/g, 'ñ')
      .replace(/&nbsp;/g, ' ')
      
      // Konvertera HTML-struktur till text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n\n**')
      .replace(/<\/h[1-6]>/gi, '**\n')
      .replace(/<strong[^>]*>|<b[^>]*>/gi, '**')
      .replace(/<\/strong>|<\/b>/gi, '**')
      .replace(/<em[^>]*>|<i[^>]*>/gi, '_')
      .replace(/<\/em>|<\/i>/gi, '_')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<ul[^>]*>|<ol[^>]*>/gi, '\n')
      .replace(/<\/ul>|<\/ol>/gi, '\n')
      
      // Rensa återstående HTML-taggar
      .replace(/<[^>]*>/g, '')
      
      // Rensa och formatera
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const types: { [key: string]: string } = {
      'bet': 'Betänkande',
      'prop': 'Proposition',
      'mot': 'Motion',
      'dir': 'Kommittédirektiv',
      'sou': 'Statens offentliga utredning',
      'ds': 'Departementsserien',
      'rskr': 'Riksdagsskrivelse',
      'prot': 'Protokoll',
      'fr': 'Skriftlig fråga',
      'frs': 'Svar på skriftlig fråga',
      'ip': 'Interpellation',
      'yttr': 'Yttrande',
      'fpm': 'Faktapromemoria',
      'SFS': 'Svensk författningssamling',
      'sfs': 'Svensk författningssamling'
    };
    return types[type] || type;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={fetchDocumentContent}>
          <FileText className="w-3 h-3 mr-1" />
          Öppna
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-start space-x-3">
            <FileText className="w-5 h-5 mt-1 text-blue-600" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{document.titel}</h3>
              {document.undertitel && (
                <p className="text-sm text-gray-600 mt-1">{document.undertitel}</p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {/* Document metadata */}
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{getDocumentTypeLabel(document.typ)}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{formatDate(document.datum)}</span>
                </div>
                {document.beteckning && (
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span className="font-mono">{document.beteckning}</span>
                  </div>
                )}
                {document.organ && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span>{document.organ}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document content */}
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Laddar dokumentinnehåll...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600 font-medium">Kunde inte ladda dokumentinnehåll</p>
              </div>
              <p className="text-red-600 text-sm mb-3">{error}</p>
              {(document.dokument_url_html || document.dokument_url_text || document.beteckning) && (
                <div className="space-y-2">
                  {document.dokument_url_html && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https:${document.dokument_url_html}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Öppna HTML-version
                      </a>
                    </Button>
                  )}
                  {document.beteckning && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://data.riksdagen.se/dokument/${document.beteckning.replace(/\s+/g, '')}.html`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Öppna på riksdagen.se
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {documentContent && (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-gray-800 max-h-96 overflow-y-auto">
                  {documentContent}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
