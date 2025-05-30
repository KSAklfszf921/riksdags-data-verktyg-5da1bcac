
import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ExternalLink, Clock, MessageSquare, Eye, Loader2 } from 'lucide-react';
import { Speech } from '../types/member';

interface RecentSpeechesProps {
  speeches: Speech[];
  memberName: string;
}

const RecentSpeeches = ({ speeches, memberName }: RecentSpeechesProps) => {
  const [selectedSpeech, setSelectedSpeech] = useState<Speech | null>(null);
  const [speechContent, setSpeechContent] = useState<string>('');
  const [loadingSpeech, setLoadingSpeech] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('sv-SE');
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const openSpeech = async (speech: Speech) => {
    setSelectedSpeech(speech);
    setLoadingSpeech(true);
    setSpeechContent('');
    
    try {
      if (speech.url) {
        // Try to fetch HTML content
        const response = await fetch(speech.url);
        
        if (response.ok) {
          let content = await response.text();
          
          // Clean up problematic CSS styles
          content = content.replace(/body\s*\{[^}]*\}/g, '');
          content = content.replace(/#page_\d+[^{]*\{[^}]*\}/g, '');
          content = content.replace(/margin-top:\s*0px;/g, '');
          content = content.replace(/margin-left:\s*0px;/g, '');
          
          // Extract just the speech content
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          
          const speechDiv = doc.querySelector('.anforande') || doc.querySelector('.text');
          if (speechDiv) {
            const cleanContent = speechDiv.innerHTML
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/body\s*\{[^}]*\}/g, '')
              .replace(/#page_[^{]*\{[^}]*\}/g, '');
            setSpeechContent(cleanContent);
          } else {
            setSpeechContent(content);
          }
        } else {
          // Fallback content
          setSpeechContent(`
            <div class="speech-fallback">
              <h4>${speech.title}</h4>
              <p><strong>Debatt:</strong> ${speech.debate}</p>
              <p><strong>Datum:</strong> ${formatDate(speech.date)}</p>
              ${speech.time ? `<p><strong>Tid:</strong> ${speech.time}</p>` : ''}
              ${speech.text ? `<div class="speech-text"><p>${speech.text}</p></div>` : ''}
            </div>
          `);
        }
      } else {
        // Fallback when no URL is available
        setSpeechContent(`
          <div class="speech-fallback">
            <h4>${speech.title}</h4>
            <p><strong>Debatt:</strong> ${speech.debate}</p>
            <p><strong>Datum:</strong> ${formatDate(speech.date)}</p>
            ${speech.time ? `<p><strong>Tid:</strong> ${speech.time}</p>` : ''}
            ${speech.text ? `<div class="speech-text"><p>${speech.text}</p></div>` : ''}
          </div>
        `);
      }
    } catch (err) {
      console.error('Error fetching speech content:', err);
      setSpeechContent(`
        <div class="speech-error">
          <p>Kunde inte ladda anförandets innehåll.</p>
          ${speech.url ? `<p><a href="${speech.url}" target="_blank" rel="noopener noreferrer">Öppna direkt länk</a></p>` : ''}
        </div>
      `);
    } finally {
      setLoadingSpeech(false);
    }
  };

  const recentSpeeches = speeches.slice(0, 10);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto font-bold text-purple-600 hover:text-purple-800">
            {speeches.length}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Senaste anföranden - {memberName}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {recentSpeeches.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tid</TableHead>
                    <TableHead>Debatt</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSpeeches.map((speech) => (
                    <TableRow key={speech.id}>
                      <TableCell className="font-medium">
                        <div className="max-w-sm">
                          <p className="truncate">{speech.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {speech.type || 'Anförande'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(speech.date)}</TableCell>
                      <TableCell>
                        {speech.time && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(speech.time)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm truncate">{speech.debate}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openSpeech(speech)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Öppna</span>
                          </Button>
                          {speech.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={speech.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">Inga anföranden registrerade</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog för att visa anförande */}
      <Dialog open={!!selectedSpeech} onOpenChange={(open) => !open && setSelectedSpeech(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <span>Anförande - {memberName}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {loadingSpeech ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Laddar anförande...</span>
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none speech-content"
                dangerouslySetInnerHTML={{ __html: speechContent }}
                style={{
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              />
            )}
          </div>
          
          {selectedSpeech && (
            <div className="border-t pt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {selectedSpeech.date} • {selectedSpeech.type || 'Anförande'} • {selectedSpeech.debate}
              </div>
              {selectedSpeech.url && (
                <Button variant="outline" size="sm" asChild>
                  <a 
                    href={selectedSpeech.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Öppna ursprunglig</span>
                  </a>
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecentSpeeches;
