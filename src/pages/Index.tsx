
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Users, FileText, MessageSquare, BarChart3, Search, TrendingUp, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveHeader from "@/components/ResponsiveHeader";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const quickStats = [
    { label: "Aktiva ledamöter", value: "349", icon: Users, color: "text-blue-600" },
    { label: "Senaste voteringar", value: "1,247", icon: BarChart3, color: "text-green-600" },
    { label: "Dokument idag", value: "23", icon: FileText, color: "text-purple-600" },
    { label: "Kommittémöten", value: "8", icon: CalendarDays, color: "text-orange-600" },
  ];

  const recentActivity = [
    { type: "Votering", title: "Förslag om klimatpolitik", time: "2 tim sedan" },
    { type: "Interpellation", title: "Fråga om sjukvård", time: "4 tim sedan" },
    { type: "Motion", title: "Förslag om utbildning", time: "6 tim sedan" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ResponsiveHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold text-gray-900">Riksdag Explorer</h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            Säker och transparent tillgång till Sveriges riksdagsdata
          </p>
          {user && (
            <Badge variant="secondary" className="mb-4">
              Inloggad som {user.email}
            </Badge>
          )}
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Sök ledamöter, dokument, voteringar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button>
                <Search className="w-4 h-4 mr-2" />
                Sök
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/ledamoter">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Riksdagsledamöter</span>
                </CardTitle>
                <CardDescription>
                  Utforska alla riksdagsledamöter med avancerade filter
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/voteringar">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Voteringar</span>
                </CardTitle>
                <CardDescription>
                  Analysera röstningar och beslut i riksdagen
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/dokument">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Dokument</span>
                </CardTitle>
                <CardDescription>
                  Sök och utforska riksdagsdokument
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/anforanden">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Anföranden</span>
                </CardTitle>
                <CardDescription>
                  Läs tal och debatter från riksdagen
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/kalender">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>Kalender</span>
                </CardTitle>
                <CardDescription>
                  Se kommande möten och evenemang
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/topplistor">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Topplistor</span>
                </CardTitle>
                <CardDescription>
                  Statistik och rankningar
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Senaste aktivitet</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <Badge variant="outline" className="mr-2">
                        {activity.type}
                      </Badge>
                      <span className="text-sm">{activity.title}</span>
                    </div>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Systemstatus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Datasäkerhet</span>
                    <span className="text-green-600 font-medium">Aktiv</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Datasynkronisering</span>
                    <span className="text-blue-600 font-medium">Normal</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>RLS-policyer</span>
                    <span className="text-green-600 font-medium">Säkra</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
