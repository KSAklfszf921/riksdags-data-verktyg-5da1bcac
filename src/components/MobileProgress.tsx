
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

interface MobileProgressProps {
  value: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'compact' | 'minimal';
  color?: string;
}

const MobileProgress: React.FC<MobileProgressProps> = ({
  value,
  label,
  showPercentage = true,
  variant = 'default',
  color
}) => {
  if (variant === 'minimal') {
    return (
      <div className="space-y-1">
        {label && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">{label}</span>
            {showPercentage && (
              <span className="text-gray-800 font-medium">{Math.round(value)}%</span>
            )}
          </div>
        )}
        <Progress 
          value={value} 
          indicatorColor={color}
          size="sm"
          className="h-1.5"
        />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        {label && (
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            {showPercentage && (
              <span className="text-sm text-gray-600">{Math.round(value)}%</span>
            )}
          </div>
        )}
        <Progress 
          value={value} 
          indicatorColor={color}
          size="default"
        />
      </div>
    );
  }

  return (
    <Card className="border-gray-200">
      <CardContent className="pt-4 space-y-3">
        {label && (
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-900">{label}</h4>
            {showPercentage && (
              <span className="text-lg font-semibold text-blue-600">
                {Math.round(value)}%
              </span>
            )}
          </div>
        )}
        <Progress 
          value={value} 
          indicatorColor={color}
          size="lg"
          labelPosition="inside"
          showPercentage={showPercentage}
        />
      </CardContent>
    </Card>
  );
};

export default MobileProgress;
