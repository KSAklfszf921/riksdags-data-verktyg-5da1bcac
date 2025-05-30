
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
      // Prioritera text-format över HTML för bättre läsbarhet
      const url = document.dokument_url_text || document.dokument_url_html;
      if (!url) {
        throw new Error('Ingen dokument-URL tillgänglig');
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Kunde inte hämta dokumentet');
      }
      
      let content = await response.text();
      
      // Rensa bort XML-taggar och onödig information från innehållet
      if (content.includes('<dokumentstatus>')) {
        // Extrahera endast relevant textinnehåll från XML-strukturen
        const textMatch = content.match(/<text>(.*?)<\/text>/s);
        if (textMatch) {
          content = textMatch[1];
        } else {
          // Om ingen text-tag finns, försök hitta beskrivning eller sammandrag
          const summaryMatch = content.match(/<summary>(.*?)<\/summary>/s) || 
                              content.match(/<notis>(.*?)<\/notis>/s) ||
                              content.match(/<beskrivning>(.*?)<\/beskrivning>/s);
          if (summaryMatch) {
            content = summaryMatch[1];
          } else {
            content = 'Dokumentinnehåll kunde inte extraheras korrekt. Använd länken för att öppna i ny flik.';
          }
        }
      }
      
      // Rensa HTML-entiteter och formatera texten
      content = content
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
        .replace(/<BR\/>/g, '\n')
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '') // Ta bort återstående HTML-taggar
        .trim();

      if (!content || content.length < 50) {
        throw new Error('Dokumentet verkar vara tomt eller innehåller endast metadata');
      }
      
      setDocumentContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
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
      'fpm': 'Faktapromemoria'
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
              <span>Laddar dokument...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600 font-medium">Kunde inte ladda dokumentinnehåll</p>
              </div>
              <p className="text-red-600 text-sm mb-3">{error}</p>
              {(document.dokument_url_html || document.dokument_url_text) && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={document.dokument_url_html || document.dokument_url_text} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Öppna i ny flik
                  </a>
                </Button>
              )}
            </div>
          )}

          {documentContent && (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-gray-800">
                  {documentContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
