
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Vote, 
  Calendar, 
  TrendingUp,
  Search,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const Index = () => {
  const stats = [
    {
      title: "Ledamöter",
      value: "349",
      description: "Aktiva riksdagsledamöter",
      icon: Users,
      href: "/ledamoter",
      color: "text-blue-600"
    },
    {
      title: "Voteringar",
      value: "2,847",
      description: "Senaste riksmötet",
      icon: Vote,
      href: "/voteringar",
      color: "text-green-600"
    },
    {
      title: "Dokument",
      value: "15,234",
      description: "Motioner och propositioner",
      icon: FileText,
      href: "/dokument",
      color: "text-purple-600"
    },
    {
      title: "Anföranden",
      value: "8,921",
      description: "Debattinlägg",
      icon: MessageSquare,
      href: "/anforanden",
      color: "text-orange-600"
    },
  ];

  const recentActivity = [
    {
      type: "Votering",
      title: "Förslag om klimatpolitik",
      date: "2024-03-15",
      status: "Antagen",
      badge: "success"
    },
    {
      type: "Motion",
      title: "Förbättrad järnvägstrafik",
      date: "2024-03-14",
      status: "Under behandling",
      badge: "warning"
    },
    {
      type: "Interpellation",
      title: "Fråga om utbildningspolitik",
      date: "2024-03-13",
      status: "Besvarad",
      badge: "default"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Välkommen till Riksdagskollen
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Utforska Sveriges riksdag med vårt omfattande verktyg för att söka och analysera 
            riksdagsdata, inklusive ledamöter, voteringar, dokument och anföranden.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="text-sm text-gray-500">
              Prova den nya globala sökfunktionen i headern ↑
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link to={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Search Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-blue-600" />
                <span>Sökverktyg</span>
              </CardTitle>
              <CardDescription>
                Avancerad sökning inom alla typer av riksdagsdata
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/ledamoter">
                  <Users className="mr-2 h-4 w-4" />
                  Sök ledamöter och deras aktivitet
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/voteringar">
                  <Vote className="mr-2 h-4 w-4" />
                  Analysera voteringsresultat
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/dokument">
                  <FileText className="mr-2 h-4 w-4" />
                  Utforska motioner och propositioner
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/anforanden">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Läs debattinlägg och anföranden
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Senaste aktivitet</span>
              </CardTitle>
              <CardDescription>
                Nyligen genomförda voteringar och inlämnade dokument
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.date}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      activity.badge === 'success' ? 'default' : 
                      activity.badge === 'warning' ? 'secondary' : 
                      'outline'
                    }
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card>
          <CardHeader>
            <CardTitle>Funktioner</CardTitle>
            <CardDescription>
              Utforska alla möjligheter med Riksdagskollen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Global sökning</h4>
                <p className="text-sm text-gray-600">
                  Sök över alla datatyper med autocomplete och förhandsvisning
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Detaljerad analys</h4>
                <p className="text-sm text-gray-600">
                  Djupgående information om voteringsmönster och partiaktivitet
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Realtidsdata</h4>
                <p className="text-sm text-gray-600">
                  Aktuell information direkt från riksdagens öppna data
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Exportmöjligheter</h4>
                <p className="text-sm text-gray-600">
                  Ladda ner sökresultat för vidare analys
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Mobilanpassad</h4>
                <p className="text-sm text-gray-600">
                  Fungerar perfekt på alla enheter och skärmstorlekar
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Öppen källkod</h4>
                <p className="text-sm text-gray-600">
                  Transparent och utvecklad för allmänhetens bästa
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Index;
