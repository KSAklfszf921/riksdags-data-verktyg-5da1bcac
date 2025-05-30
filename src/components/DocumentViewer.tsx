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
      const urls = [];
      
      // Lägg till direktlänkar om de finns
      if (document.dokument_url_html) {
        const htmlUrl = document.dokument_url_html.startsWith('//') 
          ? `https:${document.dokument_url_html}` 
          : document.dokument_url_html;
        urls.push(htmlUrl);
      }
      
      // Konstruera URLs baserat på beteckning
      if (document.beteckning) {
        const beteckning = document.beteckning.replace(/\s+/g, '');
        urls.push(`https://data.riksdagen.se/dokument/${beteckning}.html`);
        urls.push(`https://data.riksdagen.se/dokument/${beteckning}`);
      }
      
      console.log('Trying URLs:', urls);
      
      let content = '';
      
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
          
          // Rensa och formatera innehållet
          const cleanedContent = cleanAndFormatContent(extractedContent);
          console.log('Cleaned content length:', cleanedContent.length);
          
          // Om innehållet ser ut som riktig text, använd det
          if (cleanedContent.length > 200 && !isOnlyMetadata(cleanedContent)) {
            content = cleanedContent;
            console.log('Found good content from:', url);
            break;
          }
          
        } catch (err) {
          console.error(`Error fetching from ${url}:`, err);
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
    // Hitta huvud-innehållsområdet baserat på Riksdagens HTML-struktur
    let content = '';
    
    // Försök hitta huvudinnehåll i ordning av prioritet
    const contentSelectors = [
      // Specifika innehållsområden för olika dokumenttyper
      /<div[^>]*class="[^"]*dokument[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*main-content[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s,
      /<main[^>]*>(.*?)<\/main>/s,
      
      // Betänkanden och propositioner
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s,
      /<div[^>]*class="[^"]*document-content[^"]*"[^>]*>(.*?)<\/div>/s,
      
      // Fallback: hela body minus navigation
      /<body[^>]*>(.*?)<\/body>/s
    ];
    
    for (const regex of contentSelectors) {
      const match = htmlContent.match(regex);
      if (match && match[1]) {
        content = match[1];
        console.log('Found content with selector');
        
        // Rensa bort navigation och andra störande element
        content = removeUnwantedElements(content);
        
        // Om vi hittat betydande innehåll, använd det
        if (content.length > 500) {
          break;
        }
      }
    }
    
    return content;
  };

  const removeUnwantedElements = (content: string): string => {
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
      
      // Ta bort CSS och JavaScript
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      
      // Ta bort sidnavigation och metadata
      .replace(/<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>.*?<\/div>/gs, '')
      .replace(/<div[^>]*class="[^"]*metadata[^"]*"[^>]*>.*?<\/div>/gs, '');
  };

  const extractContentFromXML = (xmlContent: string): string => {
    const xmlSelectors = [
      /<dokinttext[^>]*>(.*?)<\/dokinttext>/s,
      /<text[^>]*>(.*?)<\/text>/s,
      /<dokument[^>]*>(.*?)<\/dokument>/s,
      /<summary[^>]*>(.*?)<\/summary>/s
    ];
    
    for (const regex of xmlSelectors) {
      const match = xmlContent.match(regex);
      if (match && match[1] && match[1].trim().length > 100) {
        return match[1];
      }
    }
    
    return xmlContent;
  };

  const cleanAndFormatContent = (content: string): string => {
    return content
      // Ta bort alla HTML-taggar men behåll struktur
      .replace(/<script[^>]*>.*?<\/script>/gs, '')
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<link[^>]*>/gs, '')
      .replace(/<meta[^>]*>/gs, '')
      
      // Ta bort CSS-klasser och inline styles
      .replace(/style="[^"]*"/gs, '')
      .replace(/class="[^"]*"/gs, '')
      .replace(/id="[^"]*"/gs, '')
      
      // Ta bort CSS-kod som läckt in
      .replace(/#[a-zA-Z0-9_-]+\s*\{[^}]*\}/gs, '')
      .replace(/\.[a-zA-Z0-9_-]+\s*\{[^}]*\}/gs, '')
      .replace(/@[a-zA-Z-]+[^{]*\{[^}]*\}/gs, '')
      
      // Ta bort JavaScript-kod
      .replace(/function[^{]*\{[^}]*\}/gs, '')
      .replace(/var\s+[^;]+;/gs, '')
      .replace(/document\.[^;]+;/gs, '')
      
      // Ta bort inline CSS properties
      .replace(/position:\s*[^;]+;/gs, '')
      .replace(/margin:\s*[^;]+;/gs, '')
      .replace(/padding:\s*[^;]+;/gs, '')
      .replace(/width:\s*[^;]+;/gs, '')
      .replace(/height:\s*[^;]+;/gs, '')
      .replace(/overflow:\s*[^;]+;/gs, '')
      .replace(/border:\s*[^;]+;/gs, '')
      
      // Ta bort CSS-selektorer och properties
      .replace(/#page_\d+\s*\{[^}]*\}/gs, '')
      .replace(/\{[^}]*position:[^}]*\}/gs, '')
      
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
      .replace(/&nbsp;/g, ' ')
      
      // Konvertera HTML-struktur till ren text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<ul[^>]*>|<ol[^>]*>/gi, '\n')
      .replace(/<\/ul>|<\/ol>/gi, '\n')
      
      // Ta bort alla återstående HTML-taggar
      .replace(/<[^>]*>/g, ' ')
      
      // Ta bort Markdown-formatering
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/#{1,6}\s*/g, '')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, '')
      
      // Rensa överflödiga mellanslag och radbrytningar
      .replace(/\n\s*\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
  };

  const isOnlyMetadata = (content: string): boolean => {
    // Kontrollera om innehållet bara är metadata
    const metadataIndicators = [
      /^\d{4}-\d{2}-\d{2}\s*\d+\s*[A-Z]{2,5}\s*\d+/,
      /^[\s\d\-:]+[A-Z]{2,10}[\s\d\-:]+$/m,
      /^[A-Z]{1,3}\d{6}\s*\d{4}\/\d{2}:\d+/,
      /position:\s*relative/,
      /overflow:\s*hidden/,
      /#page_\d+/
    ];
    
    // Om innehållet matchar metadata-mönster eller innehåller CSS
    if (content.length < 500) {
      for (const indicator of metadataIndicators) {
        if (indicator.test(content.trim())) {
          return true;
        }
      }
    }
    
    // Om innehållet mestadels består av datum, siffror och CSS
    const cssLines = content.split('\n').filter(line => 
      line.includes('position:') || 
      line.includes('margin:') || 
      line.includes('#page_') ||
      line.includes('overflow:')
    );
    
    if (cssLines.length > 3) {
      return true;
    }
    
    return false;
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
