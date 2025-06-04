
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EnhancedLoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'form' | 'stats' | 'chart';
  count?: number;
  className?: string;
  showTooltip?: boolean;
  animated?: boolean;
}

const EnhancedLoadingSkeleton: React.FC<EnhancedLoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 3,
  className = '',
  showTooltip = false,
  animated = true
}) => {
  const animationClass = animated ? 'animate-pulse' : '';

  const renderCardSkeleton = () => (
    <Card className={`${animationClass} border border-gray-200 dark:border-gray-700`}>
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-3 w-4/6 bg-gray-200 dark:bg-gray-700" />
        <div className="flex space-x-2 mt-4">
          <Skeleton className="h-8 w-20 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-8 w-16 bg-gray-200 dark:bg-gray-700" />
        </div>
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <div className={`space-y-3 ${animationClass}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700" />
          </div>
          <Skeleton className="h-8 w-8 bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );

  const renderTableSkeleton = () => (
    <div className={`${animationClass} border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden`}>
      <div className="bg-gray-50 dark:bg-gray-800 grid grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4 bg-gray-300 dark:bg-gray-600" />
        ))}
      </div>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} className="h-3 bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className={`space-y-6 ${animationClass}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
          <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
          {i % 2 === 0 && (
            <Skeleton className="h-3 w-2/3 bg-gray-100 dark:bg-gray-600" />
          )}
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton className="h-10 w-24 bg-blue-200 dark:bg-blue-800" />
        <Skeleton className="h-10 w-20 bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );

  const renderStatsSkeletons = () => (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${animationClass}`}>
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 bg-gray-200 dark:bg-gray-700" />
              <Skeleton className="h-6 w-6 bg-gray-200 dark:bg-gray-700" />
            </div>
            <Skeleton className="h-8 w-16 mt-2 bg-gray-200 dark:bg-gray-700" />
            <Skeleton className="h-3 w-12 mt-1 bg-gray-200 dark:bg-gray-700" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderChartSkeleton = () => (
    <Card className={`${animationClass} border border-gray-200 dark:border-gray-700`}>
      <CardHeader>
        <Skeleton className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
        <Skeleton className="h-4 w-32 bg-gray-200 dark:bg-gray-700" />
      </CardHeader>
      <CardContent>
        <div className="h-80 flex items-end justify-between space-x-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton 
              key={i} 
              className="w-full bg-blue-200 dark:bg-blue-800" 
              style={{ height: `${Math.random() * 70 + 30}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-12 bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      case 'stats':
        return renderStatsSkeletons();
      case 'chart':
        return renderChartSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  const skeletonContent = () => {
    if (type === 'card') {
      return (
        <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
          {[...Array(count)].map((_, i) => (
            <div key={i}>{renderSkeleton()}</div>
          ))}
        </div>
      );
    }

    return <div className={className}>{renderSkeleton()}</div>;
  };

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{skeletonContent()}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Laddar innehåll...</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return skeletonContent();
};

export default EnhancedLoadingSkeleton;
