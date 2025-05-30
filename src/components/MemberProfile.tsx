import { Member } from '../types/member';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import DocumentViewer from './DocumentViewer';
import RecentSpeeches from './RecentSpeeches';
import MemberNewsField from './MemberNewsField';
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
  BarChart3,
  Building
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
      return new Date(dateString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      return new Date(dateTimeString).toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString;
    }
  };

  const getAssignmentStatus = (assignment: any) => {
    const currentDate = new Date();
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    
    if (!endDate || endDate > currentDate) {
      return 'Aktiv';
    }
    return 'Tidigare';
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case 'Aktiv':
        return 'bg-green-100 text-green-800';
      case 'Tidigare':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
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

  // Separera aktiva och tidigare uppdrag
  const currentDate = new Date();
  const activeAssignments = member.assignments?.filter(assignment => {
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    return !endDate || endDate > currentDate;
  }) || [];

  const formerAssignments = member.assignments?.filter(assignment => {
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    return endDate && endDate <= currentDate;
  }) || [];

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
                {activeAssignments.length} aktiva uppdrag • 
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
            </CardContent>
          </Card>

          {/* Nyhetsflöde - uppdaterat med memberId */}
          <MemberNewsField 
            memberName={`${member.firstName} ${member.lastName}`} 
            memberId={member.id}
          />

          {/* Aktuella uppdrag */}
          {activeAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Aktuella uppdrag ({activeAssignments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organ</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Från</TableHead>
                      <TableHead>Till</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeAssignments.map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.uppgift || assignment.organ_kod}</TableCell>
                        <TableCell>{assignment.roll}</TableCell>
                        <TableCell>
                          <Badge className={getAssignmentStatusColor(getAssignmentStatus(assignment))}>
                            {getAssignmentStatus(assignment)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(assignment.from)}</TableCell>
                        <TableCell>{assignment.tom ? formatDateTime(assignment.tom) : 'Pågående'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Tidigare uppdrag */}
          {formerAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Tidigare uppdrag ({formerAssignments.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organ</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Från</TableHead>
                      <TableHead>Till</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formerAssignments.slice(0, 10).map((assignment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{assignment.uppgift || assignment.organ_kod}</TableCell>
                        <TableCell>{assignment.roll}</TableCell>
                        <TableCell>
                          <Badge className={getAssignmentStatusColor(getAssignmentStatus(assignment))}>
                            {getAssignmentStatus(assignment)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDateTime(assignment.from)}</TableCell>
                        <TableCell>{formatDateTime(assignment.tom)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {formerAssignments.length > 10 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Visar 10 av {formerAssignments.length} tidigare uppdrag
                  </p>
                )}
              </CardContent>
            </Card>
          )}

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
                  <div className="text-2xl font-bold text-indigo-600">{activeAssignments.length}</div>
                  <div className="text-sm text-indigo-800">Aktiva uppdrag</div>
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
