
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, RefreshCw, Home, Bug, Mail, Copy } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private toastFunction: ((options: any) => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Enhanced ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Send error to monitoring service (placeholder)
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    };
    
    console.error('Error Report for Service:', errorReport);
    // TODO: Send to actual error monitoring service
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      // Use toast if available
      if (this.toastFunction) {
        this.toastFunction({
          title: "Fel kopierat",
          description: "Felinformationen har kopierats till urklipp",
        });
      }
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  handleReportError = () => {
    const subject = `Riksdagskollen Error Report - ${this.state.errorId}`;
    const body = `
Hej,

Jag stötte på ett fel i Riksdagskollen:

Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
URL: ${window.location.href}
Tid: ${new Date().toLocaleString('sv-SE')}

Beskrivning av vad jag gjorde när felet uppstod:
[Beskriv här vad du gjorde]

Tack!
    `.trim();

    const mailtoLink = `mailto:support@riksdagskollen.se?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-900/10 dark:via-gray-900 dark:to-orange-900/10 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full border-red-200 dark:border-red-800">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-800 dark:text-red-200">
                Något gick fel
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Error ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 dark:border-red-800">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  Ett oväntat fel inträffade. Vi ber om ursäkt för besväret. 
                  Du kan försöka ladda om sidan eller gå tillbaka till startsidan.
                </AlertDescription>
              </Alert>

              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                  Teknisk information
                </summary>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                  <p className="font-medium mb-1">Felmeddelande:</p>
                  <p className="font-mono break-all mb-2">
                    {this.state.error?.message}
                  </p>
                  {this.state.error?.stack && (
                    <>
                      <p className="font-medium mb-1">Stack trace:</p>
                      <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                        {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                      </pre>
                    </>
                  )}
                </div>
              </details>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={this.handleReload}
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Ladda om sidan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ladda om sidan för att försöka igen</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      onClick={this.handleGoHome}
                      className="flex items-center space-x-2"
                    >
                      <Home className="w-4 h-4" />
                      <span>Gå till startsidan</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gå tillbaka till startsidan</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.handleCopyError}
                      className="flex items-center space-x-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Kopiera fel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Kopiera felinformation till urklipp</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={this.handleReportError}
                      className="flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Rapportera fel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Skicka felrapport via e-post</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Om problemet kvarstår, kontakta oss med Error ID: {this.state.errorId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default EnhancedErrorBoundary;
