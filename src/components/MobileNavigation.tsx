
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
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
  Home
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const navigationItems = [
  { path: '/', label: 'Startsida', icon: Home, description: 'Översikt och statistik' },
  { path: '/ledamoter', label: 'Ledamöter', icon: Users, description: 'Riksdagsledamöter' },
  { path: '/voteringar', label: 'Voteringar', icon: Vote, description: 'Omröstningar' },
  { path: '/dokument', label: 'Dokument', icon: FileText, description: 'Riksdagsdokument' },
  { path: '/anforanden', label: 'Anföranden', icon: Mic, description: 'Debatter och tal' },
  { path: '/kalender', label: 'Kalender', icon: Calendar, description: 'Riksdagskalender' },
  { path: '/topplistor', label: 'Topplistor', icon: TrendingUp, description: 'Aktivitetsstatistik' },
  { path: '/partianalys', label: 'Partianalys', icon: BarChart3, description: 'Partifördelning' }
];

const MobileNavigation = () => {
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

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="relative p-2"
            aria-label="Öppna navigation"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-xl font-bold text-blue-600">
                  Riksdagskollen
                </SheetTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-gray-600 text-left">
                Utforska Sveriges riksdag
              </p>
            </SheetHeader>
            
            <nav className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = isActivePath(item.path);
                  const Icon = item.icon;
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`w-full flex items-start space-x-3 p-3 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
            
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Riksdagskollen v2.0
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
