
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import GlobalSearch from './GlobalSearch';

const Header = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Hem', href: '/' },
    { name: 'Ledamöter', href: '/ledamoter' },
    { name: 'Voteringar', href: '/voteringar' },
    { name: 'Dokument', href: '/dokument' },
    { name: 'Anföranden', href: '/anforanden' },
    { name: 'Kalender', href: '/kalender' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-900">
              Riksdagskollen
            </Link>
          </div>

          {/* Global Search */}
          <div className="flex-1 max-w-lg mx-8">
            <GlobalSearch />
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={location.pathname === item.href ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to={item.href}>
                  {item.name}
                </Link>
              </Button>
            ))}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              Meny
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
