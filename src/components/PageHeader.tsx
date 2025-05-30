
import React from 'react';
import { useResponsive } from '../hooks/use-responsive';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader = ({ title, description, icon, children }: PageHeaderProps) => {
  const { isMobile } = useResponsive();

  return (
    <div className={`${isMobile ? 'mb-4' : 'mb-8'}`}>
      <div className={`${isMobile ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white -mx-4 px-4 py-6 mb-4' : 'text-center mb-8'}`}>
        <div className="flex items-center space-x-3 mb-2">
          {icon && (
            <div className={`${isMobile ? 'w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center' : 'w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4'}`}>
              {icon}
            </div>
          )}
          <h1 className={`${isMobile ? 'text-2xl font-bold' : 'text-4xl font-bold text-gray-900'}`}>
            {title}
          </h1>
        </div>
        <p className={`${isMobile ? 'text-blue-100' : 'text-xl text-gray-600 max-w-3xl mx-auto'}`}>
          {description}
        </p>
      </div>
      {children}
    </div>
  );
};
