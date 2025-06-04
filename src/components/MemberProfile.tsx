import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  User, 
  MapPin, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  Vote,
  ExternalLink,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import MemberNewsField from './MemberNewsField';

interface Assignment {
  organ: string;
  roll_kod: string;
  from: string;
  tom?: string;
  status: string;
}

interface MemberProfileProps {
  memberId: string;
  memberData?: {
    id: string;
    member_id: string;
    first_name: string;
    last_name: string;
    party: string;
    constituency?: string;
    birth_year?: number;
    gender?: string;
    riksdag_status?: string;
    is_active?: boolean;
    assignments?: Assignment[];
    image_urls?: {
      '80'?: string;
      '192'?: string;
      max?: string;
    };
    activity_data?: {
      total_speeches?: number;
      total_votes?: number;
      committee_memberships?: number;
    };
  };
}

const MemberProfile = ({ memberId, memberData }: MemberProfileProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (memberId) {
      console.log(`Loading profile for member ID: ${memberId}`);
    }
  }, [memberId]);

  if (!memberData) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">
            Ingen ledamotdata tillgänglig för detta ID.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.status === 'aktiv') {
      return 'Aktiv';
    } else if (assignment.status === 'avliden') {
      return 'Avled';
    } else {
      return 'Inaktiv';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (error) {
      console.error("Fel vid formatering av datum:", error);
      return "Okänt datum";
    }
  };

  const memberHeaderSection = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-4">
          <Avatar>
            {memberData.image_urls?.max ? (
              <AvatarImage src={memberData.image_urls.max} alt={`${memberData.first_name} ${memberData.last_name}`} />
            ) : (
              <AvatarFallback>{memberData.first_name[0]}{memberData.last_name[0]}</AvatarFallback>
            )}
          </Avatar>
          <span>
            {memberData.first_name} {memberData.last_name}
          </span>
          <Badge variant="secondary">{memberData.party}</Badge>
        </CardTitle>
        <CardDescription>
          {memberData.constituency ? `Valdistrikt: ${memberData.constituency}` : 'Information saknas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>
              Född: {memberData.birth_year ? memberData.birth_year : 'Okänt'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>
              {memberData.constituency ? memberData.constituency : 'Okänt valkrets'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              Status: {memberData.riksdag_status ? memberData.riksdag_status : 'Okänd'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span>
              Kön: {memberData.gender ? memberData.gender : 'Okänt'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const overviewContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Översikt</span>
          </CardTitle>
          <CardDescription>
            Information om ledamotens bakgrund och engagemang.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Personlig Information
              </h3>
              <Separator className="my-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Namn:</strong> {memberData.first_name} {memberData.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Parti:</strong> {memberData.party}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Födelseår:</strong> {memberData.birth_year ? memberData.birth_year : 'Okänt'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Kön:</strong> {memberData.gender ? memberData.gender : 'Okänt'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Valdistrikt:</strong> {memberData.constituency ? memberData.constituency : 'Okänt'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Kontaktinformation
              </h3>
              <Separator className="my-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <Building className="w-4 h-4 inline-block mr-1" />
                  Riksdagen
                </p>
                <p className="text-sm text-gray-600">
                  <Phone className="w-4 h-4 inline-block mr-1" />
                  <a href="tel:08-692 20 00">08-692 20 00</a>
                </p>
                <p className="text-sm text-gray-600">
                  <Mail className="w-4 h-4 inline-block mr-1" />
                  <a href="mailto:riksdagsinformation@riksdagen.se">riksdagsinformation@riksdagen.se</a>
                </p>
                <p className="text-sm text-gray-600">
                  <ExternalLink className="w-4 h-4 inline-block mr-1" />
                  <a href="https://www.riksdagen.se/" target="_blank" rel="noopener noreferrer">www.riksdagen.se</a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Engagemang</span>
          </CardTitle>
          <CardDescription>
            Ledamotens aktivitet och deltagande i riksdagen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {memberData.activity_data?.total_speeches || 0}
              </p>
              <p className="text-sm text-gray-500">
                Anföranden
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {memberData.activity_data?.total_votes || 0}
              </p>
              <p className="text-sm text-gray-500">
                Voter
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {memberData.activity_data?.committee_memberships || 0}
              </p>
              <p className="text-sm text-gray-500">
                Utskottsuppdrag
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const assignmentsContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Utskott och Uppdrag</span>
        </CardTitle>
        <CardDescription>
          En lista över ledamotens nuvarande och tidigare uppdrag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {memberData.assignments && memberData.assignments.length > 0 ? (
          <div className="space-y-3">
            {memberData.assignments.map((assignment, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">
                  {assignment.organ}
                </h4>
                <div className="text-sm text-gray-600">
                  <strong>Roll:</strong> {assignment.roll_kod}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Från:</strong> {formatDate(assignment.from)}
                </div>
                {assignment.tom && (
                  <div className="text-sm text-gray-600">
                    <strong>Till:</strong> {formatDate(assignment.tom)}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <strong>Status:</strong> {getAssignmentStatus(assignment)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            Inga uppdrag registrerade.
          </p>
        )}
      </CardContent>
    </Card>
  );

  const activityContent = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Vote className="w-5 h-5" />
          <span>Aktivitet</span>
        </CardTitle>
        <CardDescription>
          Detaljerad statistik över ledamotens aktivitet i riksdagen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-500">
          Denna sektion kommer att visa detaljerad information om ledamotens
          aktivitet, inklusive anföranden och voteringar.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {memberHeaderSection}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="assignments">Uppdrag</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
          <TabsTrigger value="news">Nyheter</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {overviewContent}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {assignmentsContent}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          {activityContent}
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <MemberNewsField 
            memberId={memberId} 
            memberName={memberData ? `${memberData.first_name} ${memberData.last_name}` : ''}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberProfile;
