import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
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
      'votering': 'Votering'
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

          {/* Aktivitetsstatistik */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Aktivitetsstatistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
            </CardContent>
          </Card>

          {/* Anföranden från API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Senaste anföranden ({member.speeches.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.speeches.length > 0 ? (
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
                    {member.speeches.map((speech) => (
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
                <p className="text-gray-500 text-center py-4">Inga anföranden registrerade</p>
              )}
            </CardContent>
          </Card>

          {/* Dokument från ledamoten */}
          {member.documents && member.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Senaste dokument ({member.documents.length})</span>
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
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="max-w-sm">
                            <p className="truncate">{doc.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getDocumentTypeLabel(doc.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(doc.date)}</TableCell>
                        <TableCell className="font-mono text-sm">{doc.beteckning}</TableCell>
                        <TableCell>
                          {doc.url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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

          {/* Motioner och förslag */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Motioner och förslag ({member.proposals.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.proposals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">{proposal.title}</TableCell>
                        <TableCell>{proposal.type}</TableCell>
                        <TableCell>{proposal.date}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              proposal.status === 'Antagen' ? 'bg-green-100 text-green-800' :
                              proposal.status === 'Avvisad' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {proposal.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">Inga motioner eller förslag registrerade</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfile;
