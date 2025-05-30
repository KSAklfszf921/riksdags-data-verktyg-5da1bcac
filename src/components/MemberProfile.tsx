
import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import DocumentViewer from './DocumentViewer';
import RecentSpeeches from './RecentSpeeches';
import { 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  Briefcase, 
  Users, 
  MessageSquare, 
  Vote, 
  FileText,
  Star,
  Clock,
  ExternalLink,
  X,
  BarChart3
} from 'lucide-react';

interface MemberProfileProps {
  member: Member;
  onClose: () => void;
}

const MemberProfile = ({ member, onClose }: MemberProfileProps) => {
  const party = partyInfo[member.party];

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'mot': 'Motion',
      'prop': 'Proposition',
      'ip': 'Interpellation',
      'fr': 'Skriftlig fråga',
      'frs': 'Svar på skriftlig fråga',
      'bet': 'Betänkande',
      'prot': 'Protokoll',
      'kam-ip': 'Interpellationsdebatt',
      'kam-sf': 'Statsministerns frågestund',
      'rskr': 'Riksdagsskrivelse',
      'votering': 'Votering',
      'sou': 'Statens offentliga utredning',
      'ds': 'Departementsserien',
      'dir': 'Kommittédirektiv',
      'yttr': 'Yttrande',
      'fpm': 'Faktapromemoria'
    };
    return typeMap[type] || type;
  };

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

  // Konvertera dokument till RiksdagDocument format för DocumentViewer
  const convertToRiksdagDocument = (doc: any) => ({
    id: doc.id,
    titel: doc.title,
    undertitel: '',
    typ: doc.type,
    datum: doc.date,
    beteckning: doc.beteckning || '',
    organ: '',
    dokument_url_html: doc.url || '',
    dokument_url_text: ''
  });

  // Filtrera dokument för motioner och förslag
  const motionsAndProposals = member.documents?.filter(doc => 
    ['mot', 'prop', 'ip', 'fr'].includes(doc.type)
  ) || [];

  // Hitta svar på skriftliga frågor
  const getAnswersForQuestion = (questionId: string) => {
    return member.documents?.filter(doc => 
      doc.type === 'frs' && doc.title.includes(questionId)
    ) || [];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={member.imageUrl} alt={`${member.firstName} ${member.lastName}`} />
              <AvatarFallback className="text-xl">
                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member.firstName} {member.lastName}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${party?.color || 'bg-gray-500'} text-white`}>
                  {party?.fullName || member.party}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600">Aktivitetspoäng: {member.activityScore.toFixed(1)}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {member.committees.length > 0 ? `${member.committees.length} utskott` : '0 utskott'} • 
                {member.speeches.length} anföranden • 
                {member.votes.length} röster • 
                {member.motions || 0} motioner • 
                {member.interpellations || 0} interpellationer • 
                {member.writtenQuestions || 0} skriftliga frågor
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Grundläggande information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Grundläggande information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Valkrets:</strong> {member.constituency}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Födelseår:</strong> {member.birthYear}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Yrke:</strong> {member.profession}
                </span>
              </div>
              {member.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>E-post:</strong> {member.email}
                  </span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    <strong>Telefon:</strong> {member.phone}
                  </span>
                </div>
              )}
              <div className="md:col-span-2">
                <span className="text-sm">
                  <strong>Utskott:</strong> {member.committees.join(', ') || 'Ingen information tillgänglig'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Förbättrad aktivitetsstatistik med klickbara anföranden */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Aktivitetsstatistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{member.motions || 0}</div>
                  <div className="text-sm text-blue-800">Motioner</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{member.interpellations || 0}</div>
                  <div className="text-sm text-green-800">Interpellationer</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600">{member.writtenQuestions || 0}</div>
                  <div className="text-sm text-orange-800">Skriftliga frågor</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    <RecentSpeeches 
                      speeches={member.speeches} 
                      memberName={`${member.firstName} ${member.lastName}`}
                    />
                  </div>
                  <div className="text-sm text-purple-800">Anföranden</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{member.votes.length}</div>
                  <div className="text-sm text-red-800">Röster</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600">{member.committees.length}</div>
                  <div className="text-sm text-indigo-800">Utskott</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alla dokument med DocumentViewer */}
          {member.documents && member.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Alla dokument ({member.documents.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Beteckning</TableHead>
                      <TableHead>Svar</TableHead>
                      <TableHead>Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.documents.map((doc) => {
                      const answers = doc.type === 'fr' ? getAnswersForQuestion(doc.beteckning || doc.id) : [];
                      return (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-sm">
                              <p className="truncate">{doc.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                doc.type === 'mot' ? 'bg-blue-100 text-blue-800' :
                                doc.type === 'prop' ? 'bg-green-100 text-green-800' :
                                doc.type === 'ip' ? 'bg-orange-100 text-orange-800' :
                                doc.type === 'fr' ? 'bg-purple-100 text-purple-800' :
                                doc.type === 'frs' ? 'bg-purple-200 text-purple-900' :
                                doc.type === 'sou' ? 'bg-yellow-100 text-yellow-800' :
                                doc.type === 'ds' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {getDocumentTypeLabel(doc.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(doc.date)}</TableCell>
                          <TableCell className="font-mono text-sm">{doc.beteckning}</TableCell>
                          <TableCell>
                            {answers.length > 0 && (
                              <div className="space-y-1">
                                {answers.map((answer) => (
                                  <div key={answer.id} className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                      Svar: {answer.beteckning}
                                    </Badge>
                                    <DocumentViewer document={convertToRiksdagDocument(answer)} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <DocumentViewer document={convertToRiksdagDocument(doc)} />
                              {doc.url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Röstningar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Vote className="w-5 h-5" />
                <span>Röstningar ({member.votes.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.votes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proposition</TableHead>
                      <TableHead>Debatt</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Röst</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.votes.map((vote) => (
                      <TableRow key={vote.id}>
                        <TableCell className="font-medium">{vote.proposition}</TableCell>
                        <TableCell>{vote.debate}</TableCell>
                        <TableCell>{vote.date}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              vote.vote === 'Ja' ? 'bg-green-100 text-green-800' :
                              vote.vote === 'Nej' ? 'bg-red-100 text-red-800' :
                              vote.vote === 'Avstår' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {vote.vote}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">Inga röstningar registrerade</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
