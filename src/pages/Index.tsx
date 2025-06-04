
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Vote, Search, MessageSquare, BarChart3, Trophy, ArrowRight, Database, Eye, TrendingUp, FileText, Calendar, Star, Clock, Zap, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import MobilePageWrapper from "@/components/MobilePageWrapper";
import { useResponsive } from "@/hooks/use-responsive";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [stats] = useState({
    totalMembers: "349",
    totalVotes: "15,000+",
    totalDocuments: "50,000+",
    totalSpeeches: "100,000+"
  });

  const analysisTools = [
    {
      title: "Ledamöter",
      description: "Utforska riksdagsledamöters profiler, bakgrund och aktivitet",
      icon: Users,
      color: "bg-blue-500",
      href: "/ledamoter",
      features: ["Detaljerade profiler", "Aktivitetsstatistik", "Utskottsuppdrag"]
    },
    {
      title: "Voteringar", 
      description: "Analysera röstningsdata och politiska ställningstaganden",
      icon: Vote,
      color: "bg-indigo-500",
      href: "/voteringar",
      features: ["Röstningshistorik", "Partianalys", "Trendspårning"]
    },
    {
      title: "Dokument",
      description: "Sök och analysera riksdagsdokument och propositioner",
      icon: FileText,
      color: "bg-green-500", 
      href: "/dokument",
      features: ["Avancerad sökning", "Dokumentanalys", "Historisk data"]
    },
    {
      title: "Anföranden",
      description: "Utforska tal och debatter från riksdagens kammare",
      icon: Search,
      color: "bg-purple-500",
      href: "/anforanden", 
      features: ["Talanalys", "Språkgranskning", "Ämnesindelning"]
    },
    {
      title: "Kalender",
      description: "Följ riksdagens kommande händelser och möten",
      icon: Calendar,
      color: "bg-orange-500",
      href: "/kalender",
      features: ["Kommande möten", "Utskottskalender", "Viktiga datum"]
    },
    {
      title: "Partianalys",
      description: "Djupanalys av partiers demografi och politiska aktivitet",
      icon: BarChart3,
      color: "bg-red-500",
      href: "/partianalys",
      features: ["Demografisk data", "Aktivitetsmetrik", "Jämförelser"]
    }
  ];

  const features = [
    {
      icon: Database,
      title: "Realtidsdata",
      description: "Live-uppdateringar från riksdagens officiella API:er med automatisk synkronisering",
      badge: "LIVE"
    },
    {
      icon: Eye,
      title: "Interaktiva visualiseringar", 
      description: "Avancerade grafer och diagram för djupare förståelse av politiska processer",
      badge: "PREMIUM"
    },
    {
      icon: TrendingUp,
      title: "Trendanalys",
      description: "AI-drivna insikter för att identifiera mönster i politiska beslut",
      badge: "AI"
    },
    {
      icon: Shield,
      title: "Transparent data",
      description: "All data kommer direkt från riksdagens öppna källor utan filter",
      badge: "VERIFIED"
    }
  ];

  const testimonials = [
    {
      quote: "Riksdagskollen har revolutionerat hur jag följer svensk politik. Otroligt kraftfulla analysverktyg!",
      author: "Maria Andersson",
      role: "Politisk journalist"
    },
    {
      quote: "Perfekt för forskningsändamål. Enkelt att hitta historiska röstningsdata och trender.",
      author: "Prof. Erik Lindström", 
      role: "Statsvetare"
    }
  ];

  const handleToolClick = (href: string) => {
    navigate(href);
  };

  const handleGetStarted = () => {
    const toolsSection = document.getElementById('analysis-tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <MobilePageWrapper 
      title="Hem" 
      description="Utforska riksdagens arbete med kraftfulla analysverktyg och visualiseringar"
      keywords={['riksdag', 'politik', 'analys', 'demokrati', 'transparens']}
    >
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge variant="outline" className="mb-4 px-4 py-2 text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />
              Powered by officiella riksdags-API:er
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
              Utforska
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block md:inline">
                {" "}riksdagens{" "}
              </span>
              arbete med transparens
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
              Riksdagskollen erbjuder kraftfulla verktyg för att analysera och visualisera data från riksdagens öppna API:er. 
              Perfekt för journalister, forskare, studenter och politiskt intresserade medborgare.
            </p>
            
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalMembers}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Ledamöter</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalVotes}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Voteringar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalDocuments}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Dokument</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.totalSpeeches}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Anföranden</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
                onClick={handleGetStarted}
              >
                Börja utforska
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/dokument')}
                className="px-8 py-3"
              >
                <Search className="mr-2 w-4 h-4" />
                Sök i dokument
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Analysis Tools Grid */}
      <section id="analysis-tools" className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Kraftfulla analysverktyg
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Välj det verktyg som passar dina behov bäst för att utforska riksdagens data
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analysisTools.map((tool, index) => (
              <Card 
                key={tool.title} 
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm cursor-pointer overflow-hidden"
                onClick={() => handleToolClick(tool.href)}
              >
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {tool.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20"
                  >
                    Utforska {tool.title}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 lg:px-8 bg-gray-50/50 dark:bg-gray-900/50 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Varför välja Riksdagskollen?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Vi erbjuder den mest avancerade plattformen för att förstå svensk politik
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="text-center group">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-2 -right-2 text-xs font-semibold"
                  >
                    {feature.badge}
                  </Badge>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Vad säger användarna?
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex text-yellow-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 italic leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Redo att börja utforska?
          </h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Få tillgång till Sveriges mest omfattande politiska analysplattform redan idag.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate('/ledamoter')}
              className="px-8 py-3"
            >
              <Users className="mr-2 w-5 h-5" />
              Utforska ledamöter
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/voteringar')}
              className="px-8 py-3 bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Vote className="mr-2 w-5 h-5" />
              Analysera voteringar
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Riksdagskollen</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Den kompletta plattformen för att följa och analysera svensk politik med transparens och tillgänglighet i fokus.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Snabblänkar</h4>
              <div className="space-y-2">
                <button 
                  onClick={() => navigate('/ledamoter')}
                  className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Ledamöter
                </button>
                <button 
                  onClick={() => navigate('/voteringar')}
                  className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Voteringar
                </button>
                <button 
                  onClick={() => navigate('/dokument')}
                  className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Dokument
                </button>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Datakälla</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                All data hämtas från riksdagens officiella öppna API:er och uppdateras kontinuerligt.
              </p>
              <div className="mt-4 flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Live-data
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Verifierad
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              © 2025 Riksdagskollen. Data från riksdagens öppna API:er. 
              <span className="ml-2">Byggd för transparens och demokratisk insyn.</span>
            </p>
          </div>
        </div>
      </footer>
    </MobilePageWrapper>
  );
};

export default Index;
