
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  title: string;
  href?: string;
}

const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  
  const getPageTitle = (pathname: string): string => {
    const routes: Record<string, string> = {
      '/': 'Hem',
      '/ledamoter': 'Ledamöter',
      '/dokument': 'Dokument',
      '/voteringar': 'Voteringar', 
      '/anforanden': 'Anföranden',
      '/kalender': 'Kalender',
      '/partianalys': 'Partianalys',
      '/topplistor': 'Topplistor',
      '/admin': 'Systemhantering',
      '/sprakanalys': 'Språkanalys',
      '/databashantering': 'Databashantering'
    };
    return routes[pathname] || 'Sida';
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Hem', href: '/' }];
    
    if (pathSegments.length > 0 && location.pathname !== '/') {
      breadcrumbs.push({
        title: getPageTitle(location.pathname)
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href} className="flex items-center">
                        {index === 0 && <Home className="w-4 h-4 mr-1" />}
                        {crumb.title}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="w-4 h-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  );
};

export default BreadcrumbNavigation;
