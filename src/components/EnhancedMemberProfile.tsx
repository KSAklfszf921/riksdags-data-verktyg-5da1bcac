
import { useState } from 'react';
import { EnhancedMember } from '../hooks/useEnhancedMembers';
import { partyInfo } from '../data/mockMembers';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  MapPin, 
  Mail, 
  Calendar, 
  Briefcase, 
  Users, 
  Star,
  Clock,
  X,
  BarChart3,
  Building,
  TrendingUp,
  FileText,
  MessageSquare,
  HelpCircle,
  Vote
} from 'lucide-react';

interface EnhancedMemberProfileProps {
  member: EnhancedMember;
  onClose: () => void;
}

const EnhancedMemberProfile = ({ member, onClose }: EnhancedMemberProfileProps) => {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const party = partyInfo[member.party];

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

  // Parse assignments from JSONB
  const assignments = Array.isArray(member.assignments) 
    ? member.assignments as any[]
    : [];

  // Separate active and former assignments
  const currentDate = new Date();
  const activeAssignments = assignments.filter(assignment => {
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    return !endDate || endDate > currentDate;
  });

  const formerAssignments = assignments.filter(assignment => {
    const endDate = assignment.tom ? new Date(assignment.tom) : null;
    return endDate && endDate <= currentDate;
  });

  // Get available years from yearly stats
  const availableYears = Object.keys(member.yearly_stats || {}).sort((a, b) => parseInt(b) - parseInt(a));
  const selectedYearStats = member.yearly_stats?.[selectedYear] || {
    motions: 0,
    interpellations: 0,
    written_questions: 0,
    speeches: 0,
    total_documents: 0
  };

  // Calculate activity score based on current year
  const currentYearStats = member.current_year_stats;
  const activityScore = (currentYearStats.motions * 2) + 
                       (currentYearStats.interpellations * 1.5) + 
                       (currentYearStats.written_questions * 1) + 
                       (currentYearStats.speeches * 0.5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage 
                src={(member.image_urls as any)?.medium || (member.image_urls as any)?.large || (member.image_urls as any)?.small} 
                alt={`${member.first_name} ${member.last_name}`} 
              />
              <AvatarFallback className="text-xl">
                {member.first_name.charAt(0)}{member.last_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {member.first_name} {member.last_name}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={`${party?.color || 'bg-gray-500'} text-white`}>
                  {party?.fullName || member.party}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600">Aktivitetspoäng: {activityScore.toFixed(1)}</span>
                </div>
                <Badge variant={member.is_active ? "default" : "secondary"}>
                  {member.is_active ? 'Aktiv' : 'Tidigare ledamot'}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {activeAssignments.length} aktiva uppdrag • 
                {currentYearStats.total_documents} dokument i år • 
                {currentYearStats.motions} motioner • 
                {currentYearStats.interpellations} interpellationer • 
                {currentYearStats.written_questions} skriftliga frågor • 
                {currentYearStats.speeches} anföranden
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
                  <strong>Valkrets:</strong> {member.constituency || 'Ej angiven'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Födelseår:</strong> {member.birth_year || 'Ej angivet'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Status:</strong> {member.riksdag_status || 'Riksdagsledamot'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  <strong>Kön:</strong> {
                    member.gender === 'man' ? 'Man' : 
                    member.gender === 'kvinna' ? 'Kvinna' : 
                    'Ej angivet'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Årlig aktivitetsstatistik med år-väljare */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Aktivitetsstatistik per år</span>
                </CardTitle>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Välj år" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 flex items-center justify-center space-x-1">
                    <FileText className="w-5 h-5" />
                    <span>{selectedYearStats.motions}</span>
                  </div>
                  <div className="text-sm text-blue-800">Motioner</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center space-x-1">
                    <MessageSquare className="w-5 h-5" />
                    <span>{selectedYearStats.interpellations}</span>
                  </div>
                  <div className="text-sm text-green-800">Interpellationer</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 flex items-center justify-center space-x-1">
                    <HelpCircle className="w-5 h-5" />
                    <span>{selectedYearStats.written_questions}</span>
                  </div>
                  <div className="text-sm text-orange-800">Skriftliga frågor</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 flex items-center justify-center space-x-1">
                    <Vote className="w-5 h-5" />
                    <span>{selectedYearStats.speeches || 0}</span>
                  </div>
                  <div className="text-sm text-purple-800">Anföranden</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-indigo-600 flex items-center justify-center space-x-1">
                    <BarChart3 className="w-5 h-5" />
                    <span>{selectedYearStats.total_documents}</span>
                  </div>
                  <div className="text-sm text-indigo-800">Totalt dokument</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flersårig jämförelse */}
          {availableYears.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Flersårig jämförelse</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>År</TableHead>
                      <TableHead>Motioner</TableHead>
                      <TableHead>Interpellationer</TableHead>
                      <TableHead>Skriftliga frågor</TableHead>
                      <TableHead>Anföranden</TableHead>
                      <TableHead>Totalt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {availableYears.map(year => {
                      const yearStats = member.yearly_stats[year];
                      return (
                        <TableRow key={year} className={year === selectedYear ? 'bg-blue-50' : ''}>
                          <TableCell className="font-medium">{year}</TableCell>
                          <TableCell>{yearStats.motions}</TableCell>
                          <TableCell>{yearStats.interpellations}</TableCell>
                          <TableCell>{yearStats.written_questions}</TableCell>
                          <TableCell>{yearStats.speeches || 0}</TableCell>
                          <TableCell className="font-medium">{yearStats.total_documents}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

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
        </div>
      </div>
    </div>
  );
};

export default EnhancedMemberProfile;
