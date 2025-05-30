
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
      // Försök att hämta fullständigt dokumentinnehåll
      let url = document.dokument_url_text || document.dokument_url_html;
      
      if (!url) {
        // Skapa URL baserat på beteckning om det inte finns direktlänk
        if (document.beteckning) {
          const beteckning = document.beteckning.replace(/\s+/g, '');
          url = `https://data.riksdagen.se/dokument/${beteckning}.html`;
        } else {
          throw new Error('Ingen dokument-URL tillgänglig');
        }
      }
      
      const fullUrl = url.startsWith('//') ? `https:${url}` : url;
      console.log('Fetching document from:', fullUrl);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Kunde inte hämta dokumentet`);
      }
      
      let content = await response.text();
      console.log('Raw content length:', content.length);
      
      // Förbättrad innehållsextrahering för olika dokumentformat
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        // HTML-format - extrahera från olika sektioner
        content = extractFromHTML(content);
      } else if (content.includes('<?xml') || content.includes('<dokument>')) {
        // XML-format - extrahera från XML-struktur
        content = extractFromXML(content);
      }
      
      // Rensa och formatera innehållet
      content = cleanAndFormatContent(content);
      
      if (!content || content.length < 50) {
        // Om fortfarande inget meningsfullt innehåll, använd sammanfattning
        content = document.summary || document.notis || 'Dokumentinnehåll kunde inte extraheras fullständigt. Prova att öppna dokumentet i en ny flik.';
      }
      
      setDocumentContent(content);
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err.message : 'Okänt fel vid hämtning av dokument');
    } finally {
      setLoading(false);
    }
  };

  const extractFromHTML = (htmlContent: string): string => {
    // Extrahera från HTML-struktur (motioner etc.)
    let content = '';
    
    // Försök extrahera från huvud-content divs
    const mainContentMatch = htmlContent.match(/<main[^>]*>(.*?)<\/main>/s) ||
                            htmlContent.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/s) ||
                            htmlContent.match(/<div[^>]*class="[^"]*hit[^"]*"[^>]*>(.*?)<\/div>/s);
    
    if (mainContentMatch) {
      content = mainContentMatch[1];
    } else {
      // Fallback - ta allt mellan body-tags
      const bodyMatch = htmlContent.match(/<body[^>]*>(.*?)<\/body>/s);
      if (bodyMatch) {
        content = bodyMatch[1];
      } else {
        content = htmlContent;
      }
    }
    
    // Försök hitta specifika innehållssektioner för motioner
    const motionSections = [
      /<div[^>]*class="[^"]*notis[^"]*"[^>]*>(.*?)<\/div>/gs,
      /<div[^>]*class="[^"]*utdrag[^"]*"[^>]*>(.*?)<\/div>/gs,
      /<h4[^>]*>.*?<\/h4>\s*<div[^>]*class="[^"]*meta[^"]*"[^>]*>(.*?)<\/div>/gs
    ];
    
    for (const regex of motionSections) {
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        content = matches.join('\n\n');
        break;
      }
    }
    
    return content;
  };

  const extractFromXML = (xmlContent: string): string => {
    // Extrahera från XML-format
    const xmlSections = [
      /<dokument[^>]*>(.*?)<\/dokument>/s,
      /<text[^>]*>(.*?)<\/text>/s,
      /<dokinttext[^>]*>(.*?)<\/dokinttext>/s,
      /<summary[^>]*>(.*?)<\/summary>/s,
      /<notis[^>]*>(.*?)<\/notis>/s
    ];
    
    for (const regex of xmlSections) {
      const match = xmlContent.match(regex);
      if (match && match[1].trim()) {
        return match[1];
      }
    }
    
    return xmlContent;
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
