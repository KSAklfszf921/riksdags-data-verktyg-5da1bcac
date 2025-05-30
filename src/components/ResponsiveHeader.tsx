
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/use-responsive';
import MobileNavigation from './MobileNavigation';

interface ResponsiveHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  children?: React.ReactNode;
}

const ResponsiveHeader = ({ 
  title, 
  description, 
  icon, 
  showBackButton = true, 
  backPath = '/',
  children 
}: ResponsiveHeaderProps) => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return (
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <MobileNavigation />
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(backPath)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600 truncate">{description}</p>
            )}
          </div>
        </div>
        
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MobileNavigation />
            {showBackButton && (
              <Button 
                variant="ghost" 
                onClick={() => navigate(backPath)}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          {icon && (
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600">{description}</p>
            )}
          </div>
        </div>
        
        {children}
      </div>
    );
  }

  // Desktop view
  return (
    <div className="mb-8">
      {showBackButton && (
        <Button 
          variant="ghost" 
          onClick={() => navigate(backPath)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Button>
      )}
      
      <div className="flex items-center space-x-4 mb-6">
        {icon && (
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
      </div>
      
      {children}
    </div>
  );
};

export default ResponsiveHeader;
