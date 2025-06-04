
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, X } from "lucide-react";

interface ErrorInfo {
  id: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  retryCount: number;
}

interface ErrorHandlerProps {
  errors: ErrorInfo[];
  onRetry: (errorId: string) => void;
  onDismiss: (errorId: string) => void;
  maxRetries: number;
}

const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  errors,
  onRetry,
  onDismiss,
  maxRetries
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-500" />
          Error Handler
          {errors.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errors.length} errors
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-48 overflow-y-auto">
        {errors.length === 0 ? (
          <p className="text-sm text-gray-500">No errors detected</p>
        ) : (
          errors.map((error) => (
            <div key={error.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getSeverityColor(error.severity)}>
                      {error.severity}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Retry {error.retryCount}/{maxRetries}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{error.message}</p>
                  <p className="text-xs text-gray-500">
                    {error.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  {error.retryCount < maxRetries && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(error.id)}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDismiss(error.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default ErrorHandler;
