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
          
          // Formatera innehållet för Riksdag-stil baserat på dokumenttyp
          const formattedContent = formatAsRiksdagDocument(extractedContent, document);
          console.log('Formatted content length:', formattedContent.length);
          
          // Om innehållet ser ut som riktig text, använd det
          if (formattedContent.length > 200 && !isOnlyMetadata(formattedContent)) {
            content = formattedContent;
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
    
    // Förbättrade selektorer för olika dokumenttyper
    const contentSelectors = [
      // SOU-specifika selektorer
      /<div[^>]*class="[^"]*sou[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*id="[^"]*sou[^"]*"[^>]*>(.*?)<\/div>/si,
      
      // Proposition-specifika selektorer
      /<div[^>]*class="[^"]*prop[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*id="[^"]*prop[^"]*"[^>]*>(.*?)<\/div>/si,
      
      // Departementsserie-specifika selektorer
      /<div[^>]*class="[^"]*ds[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*id="[^"]*ds[^"]*"[^>]*>(.*?)<\/div>/si,
      
      // Allmänna innehållsområden
      /<div[^>]*class="[^"]*dokument[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*class="[^"]*main-content[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/si,
      /<main[^>]*>(.*?)<\/main>/si,
      
      // Betänkanden och propositioner
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*class="[^"]*document-content[^"]*"[^>]*>(.*?)<\/div>/si,
      
      // Specifik Riksdag struktur
      /<div[^>]*class="[^"]*pconf[^"]*"[^>]*>(.*?)<\/div>/si,
      /<div[^>]*class="[^"]*Section1[^"]*"[^>]*>(.*?)<\/div>/si,
      
      // Fallback: hela body minus navigation
      /<body[^>]*>(.*?)<\/body>/si
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

  const formatAsRiksdagDocument = (content: string, documentInfo: RiksdagDocument): string => {
    // Rensa innehållet först
    let cleanedContent = cleanAndFormatContent(content);
    
    // Strukturera innehållet som ett Riksdagsdokument baserat på typ
    let formattedContent = '';
    
    // Lägg till dokumenthuvud
    formattedContent += createDocumentHeader(documentInfo);
    
    // Bearbeta innehållet för att identifiera och formatera strukturelement
    formattedContent += processContentStructureByType(cleanedContent, documentInfo.typ);
    
    return formattedContent;
  };

  const createDocumentHeader = (documentInfo: RiksdagDocument): string => {
    const docType = getDocumentTypeLabel(documentInfo.typ);
    const authors = extractAuthors(documentInfo);
    
    return `
      <div class="document-header">
        <div class="publication-type">${docType}</div>
        <div class="document-number">${documentInfo.beteckning || ''}</div>
        ${authors ? `<div class="authors">${authors}</div>` : ''}
        <h1>${documentInfo.titel}</h1>
        ${documentInfo.undertitel ? `<div class="subtitle">${documentInfo.undertitel}</div>` : ''}
      </div>
    `;
  };

  const extractAuthors = (documentInfo: RiksdagDocument): string => {
    // Försök extrahera författare från titel eller undertitel
    const titleMatch = documentInfo.titel?.match(/av\s+([^(]+)/i);
    const subtitleMatch = documentInfo.undertitel?.match(/av\s+([^(]+)/i);
    
    return titleMatch?.[1]?.trim() || subtitleMatch?.[1]?.trim() || '';
  };

  const processContentStructureByType = (content: string, docType: string): string => {
    let processedContent = content;

    // Anpassa formatering baserat på dokumenttyp
    switch (docType) {
      case 'sou':
        processedContent = formatSOUDocument(content);
        break;
      case 'prop':
        processedContent = formatPropositionDocument(content);
        break;
      case 'ds':
        processedContent = formatDSDocument(content);
        break;
      case 'mot':
        processedContent = formatMotionDocument(content);
        break;
      case 'bet':
        processedContent = formatBetankandeDocument(content);
        break;
      default:
        processedContent = formatGenericDocument(content);
    }

    return processedContent;
  };

  const formatSOUDocument = (content: string): string => {
    return content
      // SOU-specifik formatering
      .replace(/(Statens offentliga utredningar|SOU \d{4}:\d+)/gi, 
        '<h1 class="sou-header">$1</h1>')
      
      // Kapitelrubriker
      .replace(/^(\d+\.?\s+[A-ZÅÄÖ][^\.]*?)$/gm, '<h2>$1</h2>')
      
      // Underkapitel
      .replace(/^(\d+\.\d+\.?\s+[A-ZÅÄÖ][^\.]*?)$/gm, '<h3>$1</h3>')
      
      // Förslagens konsekvenser
      .replace(/(Förslagens konsekvenser|FÖRSLAGENS KONSEKVENSER)/gi, 
        '<h2 class="consequences-header">Förslagens konsekvenser</h2>')
      
      // Sammanfattning
      .replace(/(Sammanfattning|SAMMANFATTNING)/gi, 
        '<h2 class="summary-header">Sammanfattning</h2>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Rensa upp extra taggar
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
  };

  const formatPropositionDocument = (content: string): string => {
    return content
      // Proposition-specifik formatering
      .replace(/(Proposition \d{4}\/\d{2}:\d+|Prop\. \d{4}\/\d{2}:\d+)/gi, 
        '<h1 class="proposition-header">$1</h1>')
      
      // Regeringens förslag
      .replace(/(Regeringens förslag|REGERINGENS FÖRSLAG)/gi, 
        '<h2 class="government-proposal">Regeringens förslag</h2>')
      
      // Bedömningar
      .replace(/(Regeringens bedömning|REGERINGENS BEDÖMNING)/gi, 
        '<h2 class="government-assessment">Regeringens bedömning</h2>')
      
      // Skäl för regeringens förslag
      .replace(/(Skäl för regeringens förslag|SKÄL FÖR REGERINGENS FÖRSLAG)/gi, 
        '<h2 class="government-reasons">Skäl för regeringens förslag</h2>')
      
      // Formatera numrerade förslag
      .replace(/(\d+\.\s*Riksdagen[^.]+\.)/g, 
        '<div class="numbered-proposal">$1</div>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Rensa upp
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
  };

  const formatDSDocument = (content: string): string => {
    return content
      // DS-specifik formatering
      .replace(/(Departementsserien \d{4}:\d+|Ds \d{4}:\d+)/gi, 
        '<h1 class="ds-header">$1</h1>')
      
      // Inledning
      .replace(/(Inledning|INLEDNING)/gi, 
        '<h2 class="introduction-header">Inledning</h2>')
      
      // Bakgrund
      .replace(/(Bakgrund|BAKGRUND)/gi, 
        '<h2 class="background-header">Bakgrund</h2>')
      
      // Analys
      .replace(/(Analys|ANALYS)/gi, 
        '<h2 class="analysis-header">Analys</h2>')
      
      // Slutsatser
      .replace(/(Slutsatser|SLUTSATSER)/gi, 
        '<h2 class="conclusions-header">Slutsatser</h2>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Rensa upp
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
  };

  const formatMotionDocument = (content: string): string => {
    return content
      // Motion-specifik formatering (behåll befintlig)
      .replace(/(Förslag\s+till\s+riksdagsbeslut|FÖRSLAG\s+TILL\s+RIKSDAGSBESLUT)/gi, 
        '<h1 class="proposal-header">Förslag till riksdagsbeslut</h1>')
      
      // Motivering
      .replace(/(Motivering|MOTIVERING)/gi, 
        '<h1 class="motivation-header">Motivering</h1>')
      
      // Formatera numrerade förslag
      .replace(/(\d+\.\s*Riksdagen[^.]+\.)/g, 
        '<div class="numbered-list-item">$1</div>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Rensa upp
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
  };

  const formatBetankandeDocument = (content: string): string => {
    return content
      // Betänkande-specifik formatering
      .replace(/(Betänkande \d{4}\/\d{2}:[A-Z]+\d+)/gi, 
        '<h1 class="betankande-header">$1</h1>')
      
      // Utskottets förslag
      .replace(/(Utskottets förslag|UTSKOTTETS FÖRSLAG)/gi, 
        '<h2 class="committee-proposal">Utskottets förslag</h2>')
      
      // Ärendet och dess beredning
      .replace(/(Ärendet och dess beredning|ÄRENDET OCH DESS BEREDNING)/gi, 
        '<h2 class="case-preparation">Ärendet och dess beredning</h2>')
      
      // Utskottets överväganden
      .replace(/(Utskottets överväganden|UTSKOTTETS ÖVERVÄGANDEN)/gi, 
        '<h2 class="committee-considerations">Utskottets överväganden</h2>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Rensa upp
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
  };

  const formatGenericDocument = (content: string): string => {
    return content
      // Allmän formatering för andra dokumenttyper
      .replace(/^([A-ZÅÄÖ][A-ZÅÄÖ\s]{5,})\s*$/gm, '<h2>$1</h2>')
      .replace(/^([A-ZÅÄÖ][a-zåäö\s]{10,})\s*$/gm, '<h3>$1</h3>')
      
      // Formatera paragrafer
      .replace(/\n\n+/g, '</p><p>')
      .replace(/^(.)/gm, '<p>$1')
      .replace(/(.)\n$/gm, '$1</p>')
      
      // Formatera listor
      .replace(/^\s*[-•]\s+(.+)/gm, '<li>$1</li>')
      .replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>')
      
      // Rensa upp extra taggar
      .replace(/<\/p><p><h/g, '</p><h')
      .replace(/<\/h([1-6])><p>/g, '</h$1><p>')
      .replace(/<p><\/p>/g, '');
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
      'mot': 'Motion till riksdagen',
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
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div 
                  className="riksdag-document max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: documentContent }}
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewer;
