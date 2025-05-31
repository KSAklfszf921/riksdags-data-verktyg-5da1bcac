
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { BatchProgress } from '../../types/batch';

interface BatchStatisticsProps {
  progress: BatchProgress;
}

export const BatchStatistics: React.FC<BatchStatisticsProps> = ({ progress }) => {
  return (
    <div className="space-y-4">
      {/* Enhanced Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{progress.totalMembers}</div>
          <div className="text-sm text-blue-700">Totalt ledamöter</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{progress.successfulFetches}</div>
          <div className="text-sm text-green-700">Lyckade</div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{progress.failedFetches}</div>
          <div className="text-sm text-red-700">Misslyckade</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{progress.totalRssItems}</div>
          <div className="text-sm text-purple-700">RSS-objekt</div>
        </div>
      </div>

      {/* Status Information */}
      {progress.status === 'idle' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Klicka "Starta" för att börja hämta RSS-feeds för alla aktiva riksdagsledamöter. 
            Processen kör en ledamot i taget med 2-sekunders fördröjning mellan varje för att respektera hastighetsbegränsningar.
          </AlertDescription>
        </Alert>
      )}

      {progress.status === 'completed' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Batch-bearbetning slutförd! Bearbetade {progress.totalMembers} ledamöter 
            med {progress.successfulFetches} lyckade hämtningar, {progress.failedFetches} misslyckanden 
            och totalt {progress.totalRssItems} RSS-objekt hämtade.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
