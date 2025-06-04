
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Vote, FileText, MessageSquare, Activity, Calendar } from "lucide-react";
import { cn } from '@/lib/utils';

interface StatItem {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon: React.ElementType;
  color: string;
  description?: string;
  progress?: number;
}

interface StatsDashboardProps {
  className?: string;
  showTrends?: boolean;
  compact?: boolean;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({
  className = "",
  showTrends = true,
  compact = false
}) => {
  const stats: StatItem[] = [
    {
      title: "Aktiva ledamöter",
      value: 349,
      change: 2,
      changeType: 'increase',
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      description: "Totalt antal ledamöter i riksdagen",
      progress: 100
    },
    {
      title: "Voteringar i år",
      value: "2,847",
      change: 12.5,
      changeType: 'increase',
      icon: Vote,
      color: "text-green-600 dark:text-green-400",
      description: "Genomförda voteringar 2024",
      progress: 78
    },
    {
      title: "Nya dokument",
      value: "1,234",
      change: -3.2,
      changeType: 'decrease',
      icon: FileText,
      color: "text-purple-600 dark:text-purple-400",
      description: "Publicerade dokument senaste månaden",
      progress: 65
    },
    {
      title: "Anföranden",
      value: "8,456",
      change: 8.1,
      changeType: 'increase',
      icon: MessageSquare,
      color: "text-orange-600 dark:text-orange-400",
      description: "Hållna anföranden i kammaren",
      progress: 89
    },
    {
      title: "Kommande möten",
      value: 23,
      icon: Calendar,
      color: "text-indigo-600 dark:text-indigo-400",
      description: "Schemalagda möten nästa vecka",
      progress: 45
    },
    {
      title: "Aktivitetsgrad",
      value: "94%",
      change: 2.1,
      changeType: 'increase',
      icon: Activity,
      color: "text-pink-600 dark:text-pink-400",
      description: "Genomsnittlig närvaro",
      progress: 94
    }
  ];

  const formatChange = (change: number, type: 'increase' | 'decrease') => {
    const isPositive = type === 'increase';
    return (
      <div className={cn(
        "flex items-center space-x-1 text-xs",
        isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
      )}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  if (compact) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={cn("w-5 h-5", stat.color)} />
                  {showTrends && stat.change && (
                    <Badge variant="outline" className="text-xs">
                      {formatChange(stat.change, stat.changeType!)}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    stat.color.includes('blue') && "from-blue-100 to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20",
                    stat.color.includes('green') && "from-green-100 to-green-200 dark:from-green-900/20 dark:to-green-800/20",
                    stat.color.includes('purple') && "from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20",
                    stat.color.includes('orange') && "from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20",
                    stat.color.includes('indigo') && "from-indigo-100 to-indigo-200 dark:from-indigo-900/20 dark:to-indigo-800/20",
                    stat.color.includes('pink') && "from-pink-100 to-pink-200 dark:from-pink-900/20 dark:to-pink-800/20"
                  )}>
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {stat.title}
                  </CardTitle>
                </div>
                {showTrends && stat.change && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    {formatChange(stat.change, stat.changeType!)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {stat.value}
                  </span>
                  {showTrends && stat.change && (
                    <span className={cn(
                      "text-sm font-medium",
                      stat.changeType === 'increase' 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {stat.changeType === 'increase' ? '+' : ''}{stat.change}%
                    </span>
                  )}
                </div>
                
                {stat.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {stat.description}
                  </p>
                )}
                
                {stat.progress !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Framsteg</span>
                      <span>{stat.progress}%</span>
                    </div>
                    <Progress 
                      value={stat.progress} 
                      className="h-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsDashboard;
