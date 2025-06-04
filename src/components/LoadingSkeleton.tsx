
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'table' | 'form';
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 3,
  className = ''
}) => {
  const renderCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-full mb-2" />
        <Skeleton className="h-3 w-5/6 mb-2" />
        <Skeleton className="h-3 w-4/6" />
      </CardContent>
    </Card>
  );

  const renderListSkeleton = () => (
    <div className="space-y-2 animate-pulse">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4 mb-2">
          {[...Array(4)].map((_, j) => (
            <Skeleton key={j} className="h-3" />
          ))}
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return renderListSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'form':
        return renderFormSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

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

export default LoadingSkeleton;
