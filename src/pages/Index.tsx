
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, Search, MessageSquare, BarChart3, Trophy, ArrowRight, Database, Eye, TrendingUp, FileText, Calendar, Shield, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MemberAutocomplete from "../components/MemberAutocomplete";
import type { RiksdagMember } from "../services/riksdagApi";

const Index = () => {
  const navigate = useNavigate();
  const [selectedMember, setSelectedMember] = React.useState<RiksdagMember | null>(null);
  
  const analysisTools = [
    {
      title: "Ledamöter",
      description: "Utforska riksdagsledamöter och deras bakgrund",
      icon: Users,
      color: "bg-blue-500",
      href: "/ledamoter"
    }, 
    {
      title: "Voteringar",
      description: "Analysera röstningsdata och partilinjer",
      icon: Vote,
      color: "bg-indigo-500",
      href: "/voteringar"
    }, 
    {
      title: "Dokument",
      description: "Sök och analysera riksdagsdokument",
      icon: FileText,
      color: "bg-green-500",
      href: "/dokument"
    }, 
    {
      title: "Anföranden",
      description: "Sök och analysera riksdagstal",
      icon: Search,
      color: "bg-purple-500",
      href: "/anforanden"
    }, 
    {
      title: "Kalender",
      description: "Utforska kommande kalenderhändelser",
      icon: Calendar,
      color: "bg-orange-500",
      href: "/kalender"
    }, 
    {
      title: "Partianalys",
      description: "Analysera partiers demografi och aktivitet",
      icon: BarChart3,
      color: "bg-red-500",
      href: "/partianalys"
    }
  ];
  
  const features = [
    {
      icon: Database,
      title: "Öppna API:er",
      description: "Hämta data direkt från riksdagens officiella API:er"
    }, 
    {
      icon: Eye,
      title: "Visualisering",
      description: "Interaktiva grafer och diagram för bättre förståelse"
    }, 
    {
      icon: TrendingUp,
      title: "Trendanalys",
      description: "Identifiera mönster och trender i politiska beslut"
    },
    {
      icon: Shield,
      title: "Tillförlitlig data",
      description: "All data kommer från riksdagens officiella källor"
    },
    {
      icon: Clock,
      title: "Realtidsuppdatering",
      description: "Data uppdateras kontinuerligt från riksdagens system"
    },
    {
      icon: Zap,
      title: "Snabb sökning",
      description: "Kraftfulla sökverktyg för att hitta relevant information"
    }
  ];
  
  const handleToolClick = (href: string) => {
    navigate(href);
  };

  const handleMemberSelect = (member: RiksdagMember | null) => {
    setSelectedMember(member);
    if (member) {
      navigate(`/ledamoter?id=${member.intressent_id}`);
    }
  };
  
  const handleGetStarted = () => {
    const toolsSection = document.getElementById('analysis-tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-[20px]">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Utforska
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {" "}riksdagens{" "}
              </span>
              arbete
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Riksdagskollen erbjuder kraftfulla verktyg för att analysera och visualisera data från riksdagens öppna API:er. 
              Perfekt för journalister, forskare och politiskt intresserade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3" 
                onClick={handleGetStarted}
              >
                Börja utforska
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <div className="max-w-md mx-auto mt-6">
              <MemberAutocomplete onSelectMember={handleMemberSelect} placeholder="Sök ledamot..." />
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Tools Grid */}
      <section id="analysis-tools" className="px-4 sm:px-6 lg:px-8 py-[20px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Analysverktyg
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Välj det verktyg som passar dina behov för att utforska riksdagens data
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysisTools.map((tool) => (
              <Card 
                key={tool.title} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer" 
                onClick={() => handleToolClick(tool.href)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 bg-white/50 py-[20px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Varför välja Riksdagskollen?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Våra verktyg bygger på öppna data och moderna teknologier
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-[20px]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Om Riksdagskollen
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Riksdagskollen är ett oberoende verktyg som gör det enkelt att utforska och förstå 
            riksdagens arbete. Vi använder endast öppna data från riksdagens officiella API:er 
            och presenterar informationen på ett tillgängligt och användarvänligt sätt.
          </p>
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-blue-800 font-medium">
              All data kommer direkt från riksdagens öppna API:er och uppdateras kontinuerligt.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Riksdagskollen</h3>
              <p className="text-gray-600">
                Verktyg för att utforska och analysera riksdagens öppna data.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Snabblänkar</h3>
              <ul className="space-y-2">
                <li><a href="/ledamoter" className="text-gray-600 hover:text-blue-600">Ledamöter</a></li>
                <li><a href="/voteringar" className="text-gray-600 hover:text-blue-600">Voteringar</a></li>
                <li><a href="/dokument" className="text-gray-600 hover:text-blue-600">Dokument</a></li>
                <li><a href="/anforanden" className="text-gray-600 hover:text-blue-600">Anföranden</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
              <ul className="space-y-2">
                <li><span className="text-gray-600">Data från riksdagens API</span></li>
                <li><span className="text-gray-600">Uppdateras kontinuerligt</span></li>
                <li><span className="text-gray-600">Öppen källkod</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-600">
              © 2025 Riksdagskollen. Data från riksdagens öppna API:er.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
