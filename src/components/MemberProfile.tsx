
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
  X
} from 'lucide-react';

interface MemberProfileProps {
  member: Member;
  onClose: () => void;
}

const MemberProfile = ({ member, onClose }: MemberProfileProps) => {
  const party = partyInfo[member.party];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                <Badge className={`${party.color} text-white`}>
                  {party.fullName}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600">Aktivitetspoäng: {member.activityScore}</span>
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
                  <strong>Utskott:</strong> {member.committees.join(', ')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Anföranden */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Anföranden ({member.speeches.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {member.speeches.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Debatt</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tid</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.speeches.map((speech) => (
                      <TableRow key={speech.id}>
                        <TableCell className="font-medium">{speech.title}</TableCell>
                        <TableCell>{speech.debate}</TableCell>
                        <TableCell>{speech.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{speech.duration} min</span>
                          </div>
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
                <p className="text-gray-500 text-center py-4">Inga anföranden registrerade</p>
              )}
            </CardContent>
          </Card>

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
