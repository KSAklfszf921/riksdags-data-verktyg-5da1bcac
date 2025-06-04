
import React from 'react';
import { useResponsive } from "@/hooks/use-responsive";
import { Helmet } from 'react-helmet-async';

interface MobilePageWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  keywords?: string[];
  className?: string;
}

const MobilePageWrapper: React.FC<MobilePageWrapperProps> = ({
  children,
  title,
  description,
  keywords = [],
  className = ""
}) => {
  const { isMobile } = useResponsive();

  const fullTitle = `${title} | Riksdagskollen`;
  const defaultDescription = "Utforska riksdagens arbete med kraftfulla analysverktyg och visualiseringar";
  const metaDescription = description || defaultDescription;

  return (
    <>
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta name="keywords" content={[...keywords, 'riksdag', 'politik', 'analys', 'sverige'].join(', ')} />
        
        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Riksdagskollen" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={metaDescription} />
        
        {/* Mobile optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://zqhpbclqvhjcyrgvgaon.supabase.co" />
      </Helmet>
      
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50",
        isMobile && "touch-manipulation",
        className
      )}>
        <div className={cn(
          "max-w-7xl mx-auto",
          isMobile ? "px-4 py-0" : "px-4 sm:px-6 lg:px-8 py-8"
        )}>
          {children}
        </div>
      </div>
    </>
  );
};

// Helper function for consistent class names
const cn = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default MobilePageWrapper;
