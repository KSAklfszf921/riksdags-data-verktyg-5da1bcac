
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const errorReport = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.error('Error Report:', errorReport);
    // Here you could send to an error reporting service
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-800">
                Något gick fel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Ett oväntat fel inträffade. Vi ber om ursäkt för besväret.
                </AlertDescription>
              </Alert>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">Teknisk information:</p>
                <p className="text-xs font-mono break-all">
                  {this.state.error?.message}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReload}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Ladda om sidan</span>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Gå till startsidan</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReportError}
                className="w-full text-xs"
              >
                Rapportera fel (sparar i konsol)
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
