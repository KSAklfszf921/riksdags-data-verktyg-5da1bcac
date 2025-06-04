
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Menu, 
  Users, 
  Vote, 
  FileText, 
  Mic, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  X,
  Home,
  Languages,
  Database,
  Wrench,
  TestTube
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navigationItems = [
  { 
    path: '/', 
    label: 'Startsida', 
    icon: Home, 
    description: 'Översikt och statistik',
    category: 'Huvudmeny'
  },
  { 
    path: '/ledamoter', 
    label: 'Ledamöter', 
    icon: Users, 
    description: 'Riksdagsledamöter och deras aktivitet',
    category: 'Huvudmeny'
  },
  { 
    path: '/voteringar', 
    label: 'Voteringar', 
    icon: Vote, 
    description: 'Omröstningar och röstningsresultat',
    category: 'Huvudmeny'
  },
  { 
    path: '/dokument', 
    label: 'Dokument', 
    icon: FileText, 
    description: 'Riksdagsdokument och propositioner',
    category: 'Huvudmeny'
  },
  { 
    path: '/anforanden', 
    label: 'Anföranden', 
    icon: Mic, 
    description: 'Debatter och tal i riksdagen',
    category: 'Huvudmeny'
  },
  { 
    path: '/kalender', 
    label: 'Kalender', 
    icon: Calendar, 
    description: 'Riksdagskalender och kommande evenemang',
    category: 'Huvudmeny'
  },
  { 
    path: '/topplistor', 
    label: 'Topplistor', 
    icon: TrendingUp, 
    description: 'Aktivitetsstatistik och rankningar',
    category: 'Analys'
  },
  { 
    path: '/partianalys', 
    label: 'Partianalys', 
    icon: BarChart3, 
    description: 'Partifördelning och jämförelser',
    category: 'Analys'
  },
  { 
    path: '/sprakanalys', 
    label: 'Språkanalys', 
    icon: Languages, 
    description: 'Språkanalys av debatter',
    category: 'Analys'
  },
  { 
    path: '/databashantering', 
    label: 'Databashantering', 
    icon: Database, 
    description: 'Hantera applikationsdata',
    category: 'Administration'
  },
  { 
    path: '/testverktyg', 
    label: 'Testverktyg', 
    icon: Wrench, 
    description: 'Utvecklingsverktyg',
    category: 'Administration'
  },
  { 
    path: '/calendar-test', 
    label: 'Kalendertest', 
    icon: TestTube, 
    description: 'Testa kalenderfunktioner',
    category: 'Administration'
  }
];

const ImprovedMobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Öppna navigation"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Öppna navigationsmenyn</p>
            </TooltipContent>
          </Tooltip>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0 bg-white dark:bg-gray-900">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  Riksdagskollen
                </SheetTitle>
                <div className="flex items-center space-x-2">
                  <ThemeToggle />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                Utforska Sveriges riksdag
              </p>
            </SheetHeader>
            
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const isActive = isActivePath(item.path);
                        const Icon = item.icon;
                        
                        return (
                          <Tooltip key={item.path}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleNavigation(item.path)}
                                className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-all duration-200 ${
                                  isActive 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shadow-sm' 
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{item.label}</span>
                                    {isActive && (
                                      <Badge variant="secondary" className="text-xs">
                                        Aktiv
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{item.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    {category !== 'Administration' && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </nav>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Riksdagskollen v2.0
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                Byggd med ❤️ för demokrati
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ImprovedMobileNavigation;
