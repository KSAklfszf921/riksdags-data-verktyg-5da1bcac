
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Zap, TrendingUp, Settings } from "lucide-react";

interface OptimizationSuggestion {
  table: string;
  type: 'index' | 'constraint' | 'partition';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implemented: boolean;
}

interface SchemaOptimizerProps {
  suggestions: OptimizationSuggestion[];
  onImplement: (suggestion: OptimizationSuggestion) => void;
  isAnalyzing: boolean;
}

const SchemaOptimizer: React.FC<SchemaOptimizerProps> = ({
  suggestions,
  onImplement,
  isAnalyzing
}) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'index': return <Zap className="w-3 h-3" />;
      case 'constraint': return <Settings className="w-3 h-3" />;
      case 'partition': return <TrendingUp className="w-3 h-3" />;
      default: return <Database className="w-3 h-3" />;
    }
  };

  return (
    <Card className="border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-purple-500" />
          Schema Optimizer
          {isAnalyzing && <Badge variant="secondary" className="text-xs">Analyzing</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-48 overflow-y-auto">
        {suggestions.length === 0 ? (
          <p className="text-sm text-gray-500">
            {isAnalyzing ? 'Analyzing schema...' : 'No optimizations needed'}
          </p>
        ) : (
          suggestions.map((suggestion, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getTypeIcon(suggestion.type)}
                    <span className="text-sm font-medium">{suggestion.table}</span>
                    <Badge className={getImpactColor(suggestion.impact)}>
                      {suggestion.impact} impact
                    </Badge>
                    {suggestion.implemented && (
                      <Badge variant="default" className="text-xs">
                        Implemented
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.description}</p>
                </div>
                {!suggestion.implemented && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onImplement(suggestion)}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default SchemaOptimizer;
