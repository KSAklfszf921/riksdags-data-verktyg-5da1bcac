
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { ExternalLink, Clock, MessageSquare } from 'lucide-react';

interface Speech {
  id: string;
  title: string;
  date: string;
  debate: string;
  duration: number;
  url: string;
  type: string;
  text: string;
  time?: string;
}

interface RecentSpeechesProps {
  speeches: Speech[];
  memberName: string;
}

const RecentSpeeches = ({ speeches, memberName }: RecentSpeechesProps) => {
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

  const recentSpeeches = speeches.slice(0, 10);

  return (
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
                  <TableHead>Text (utdrag)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSpeeches.map((speech) => (
                  <TableRow key={speech.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-sm">
                        <p className="truncate">{speech.title}</p>
                        <p className="text-sm text-gray-500 truncate">{speech.debate}</p>
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
                      <p className="text-sm line-clamp-2">{speech.text}</p>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={speech.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
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
  );
};

export default RecentSpeeches;
