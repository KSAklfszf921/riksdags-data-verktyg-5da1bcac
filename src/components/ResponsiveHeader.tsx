
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, MessageSquare, Vote, FileText, Calendar, BarChart3, Trophy, Languages, Database, TestTube, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ThemeToggle from './ThemeToggle';
import ImprovedMobileNavigation from './ImprovedMobileNavigation';

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
      name: 'Testverktyg',
      href: '/testverktyg',
      icon: Wrench
    },
    {
      name: 'Kalendertest',
      href: '/calendar-test',
      icon: TestTube
    }
  ];

  const NavLink = ({ item, mobile = false }: { item: typeof navigation[0]; mobile?: boolean; }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
              isActive
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800',
              mobile && 'w-full justify-start space-x-3'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.name}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gå till {item.name}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  to="/" 
                  className="text-xl font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  Riksdagskollen
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gå till startsidan</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-1">
            {navigation.slice(0, 8).map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle - visible on all screen sizes */}
            <ThemeToggle />
            
            {/* Mobile menu button - replaces the old one */}
            <ImprovedMobileNavigation />
          </div>
        </div>
      </div>
    </header>
  );
};

export { ResponsiveHeader };
