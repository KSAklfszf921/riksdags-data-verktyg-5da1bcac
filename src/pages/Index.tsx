
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Vote, Search, MessageSquare, BarChart3, Trophy, ArrowRight, Database, Eye, TrendingUp, FileText, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
const Index = () => {
  const navigate = useNavigate();
  const analysisTools = [{
    title: "Ledamöter",
    description: "Utforska riksdagsledamöter",
    icon: Users,
    color: "bg-blue-500",
    href: "/ledamoter"
  }, {
    title: "Voteringar",
    description: "Analysera röstningsdata",
    icon: Vote,
    color: "bg-indigo-500",
    href: "/voteringar"
  }, {
    title: "Dokument",
    description: "Sök riksdagsdokument",
    icon: FileText,
    color: "bg-green-500",
    href: "/dokument"
  }, {
    title: "Anföranden",
    description: "Sök riksdagstal",
    icon: Search,
    color: "bg-purple-500",
    href: "/anforanden"
  }, {
    title: "Kalender",
    description: "Utforska kalenderhändelser",
    icon: Calendar,
    color: "bg-orange-500",
    href: "/kalender"
  }, {
    title: "Partianalys",
    description: "Analysera partiers demografi och aktivitet",
    icon: BarChart3,
    color: "bg-red-500",
    href: "/partianalys"
  }];
  const features = [{
    icon: Database,
    title: "Öppna API:er",
    description: "Hämta data direkt från riksdagens officiella API:er"
  }, {
    icon: Eye,
    title: "Visualisering",
    description: "Interaktiva grafer och diagram för bättre förståelse"
  }, {
    icon: TrendingUp,
    title: "Trendanalys",
    description: "Identifiera mönster och trender i politiska beslut"
  }];
  const handleToolClick = (href: string) => {
    navigate(href);
  };
  const handleGetStarted = () => {
    // Scroll to analysis tools section
    const toolsSection = document.getElementById('analysis-tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Riksdagskollen
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600" onClick={() => navigate('/topplistor')}>
                Topplistor
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                Om oss
              </Button>
              <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
                API
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={handleGetStarted}>
                Kom igång
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3" onClick={handleGetStarted}>
                Börja utforska
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
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
            {analysisTools.map((tool, index) => <Card key={tool.title} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 backdrop-blur-sm cursor-pointer" onClick={() => handleToolClick(tool.href)}>
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
                
              </Card>)}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 bg-white/50 py-[20px]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kraftfulla funktioner
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Allt du behöver för att analysera och förstå riksdagens arbete
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => <div key={feature.title} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-[20px]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-12 text-white py-[20px]">
            <h2 className="text-3xl font-bold mb-4">
              Redo att börja?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Utforska riksdagens data och få nya insikter om svensk politik
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3" onClick={handleGetStarted}>
              Börja utforska nu
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-[10px]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Riksdagskollen</span>
              </div>
              <p className="text-gray-600 max-w-md">
                En plattform för att utforska och analysera data från svenska riksdagen. 
                Byggd för journalister, forskare och politiskt intresserade.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Verktyg
              </h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Ledamöter</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Voteringar</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Anföranden</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Dokumentation</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">API</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600">Kontakt</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 py-[5px]">
            <p className="text-center text-gray-600">
              © 2025 Riksdagskollen. Data från riksdagens öppna API:er.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;
