
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, MessageSquare, Vote, FileText, Calendar, BarChart3, Trophy, Languages, Database, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const ResponsiveHeader = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    {
      name: 'Hem',
      href: '/',
      icon: null
    }, 
    {
      name: 'Ledamöter',
      href: '/ledamoter',
      icon: User
    }, 
    {
      name: 'Anföranden',
      href: '/anforanden',
      icon: MessageSquare
    }, 
    {
      name: 'Voteringar',
      href: '/voteringar',
      icon: Vote
    }, 
    {
      name: 'Dokument',
      href: '/dokument',
      icon: FileText
    }, 
    {
      name: 'Kalender',
      href: '/kalender',
      icon: Calendar
    }, 
    {
      name: 'Partianalys',
      href: '/partianalys',
      icon: BarChart3
    }, 
    {
      name: 'Topplistor',
      href: '/topplistor',
      icon: Trophy
    }, 
    {
      name: 'Språkanalys',
      href: '/sprakanalys',
      icon: Languages
    }, 
    {
      name: 'Databashantering',
      href: '/databashantering',
      icon: Database
    },
    {
      name: 'Kalendertest',
      href: '/calendar-test',
      icon: TestTube
    }
  ];

  const NavLink = ({
    item,
    mobile = false
  }: {
    item: typeof navigation[0];
    mobile?: boolean;
  }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    
    return (
      <Link 
        to={item.href} 
        onClick={() => mobile && setIsOpen(false)} 
        className={cn(
          'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', 
          isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50', 
          mobile && 'w-full justify-start space-x-3'
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span className={mobile ? '' : 'ml-1'}>{item.name}</span>
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold text-blue-600">Riksdagskollen</Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1">
            {navigation.map(item => <NavLink key={item.name} item={item} />)}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Öppna meny</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="space-y-2">
                  {navigation.map(item => <NavLink key={item.name} item={item} mobile />)}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export { ResponsiveHeader };
