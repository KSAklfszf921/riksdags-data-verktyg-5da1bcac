
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, MessageSquare, HelpCircle, Scale } from "lucide-react";
import { cn } from '@/lib/utils';

interface ActivityStats {
  total_documents?: number;
  motions?: number;
  interpellations?: number;
  written_questions?: number;
  speeches?: number;
}

interface ActivityIndicatorProps {
  stats?: ActivityStats | null;
  variant?: 'compact' | 'detailed';
  className?: string;
}

const ActivityIndicator: React.FC<ActivityIndicatorProps> = ({
  stats,
  variant = 'compact',
  className = ""
}) => {
  const getActivityLevel = (totalDocs: number) => {
    if (totalDocs > 50) return { level: 'Hög', color: 'text-green-600 bg-green-100 dark:bg-green-900/20' };
    if (totalDocs > 20) return { level: 'Medel', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' };
    if (totalDocs > 0) return { level: 'Låg', color: 'text-red-600 bg-red-100 dark:bg-red-900/20' };
    return { level: 'Okänd', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20' };
  };

  const totalDocs = stats?.total_documents || 0;
  const activityLevel = getActivityLevel(totalDocs);

  if (variant === 'compact') {
    return (
      <Badge className={cn("text-xs flex items-center space-x-1", activityLevel.color, className)}>
        <Activity className="w-3 h-3" />
        <span>{activityLevel.level}</span>
        {totalDocs > 0 && <span>({totalDocs})</span>}
      </Badge>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Badge className={cn("text-xs", activityLevel.color)}>
          <Activity className="w-3 h-3 mr-1" />
          {activityLevel.level} aktivitet
        </Badge>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {totalDocs} dokument
        </span>
      </div>
      
      {stats && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          {stats.motions && stats.motions > 0 && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <FileText className="w-3 h-3" />
              <span>{stats.motions} motioner</span>
            </div>
          )}
          {stats.interpellations && stats.interpellations > 0 && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <MessageSquare className="w-3 h-3" />
              <span>{stats.interpellations} interpellationer</span>
            </div>
          )}
          {stats.written_questions && stats.written_questions > 0 && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <HelpCircle className="w-3 h-3" />
              <span>{stats.written_questions} frågor</span>
            </div>
          )}
          {stats.speeches && stats.speeches > 0 && (
            <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
              <Scale className="w-3 h-3" />
              <span>{stats.speeches} anföranden</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityIndicator;
