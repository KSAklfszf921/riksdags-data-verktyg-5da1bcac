
import React from 'react';
import { Progress } from '../ui/progress';
import { BatchProgress } from '../../types/batch';

interface BatchProgressDisplayProps {
  progress: BatchProgress;
  progressPercentage: number;
  lastUpdate: Date | null;
}

export const BatchProgressDisplay: React.FC<BatchProgressDisplayProps> = ({
  progress,
  progressPercentage,
  lastUpdate
}) => {
  const formatDuration = (startTime: string) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (progress.totalMembers === 0) {
    return null;
  }

  const remainingMembers = progress.totalMembers - progress.processedMembers;
  const chunksCompleted = Math.floor(progress.processedMembers / 5);
  const totalChunks = Math.ceil(progress.totalMembers / 5);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>Framsteg: {progress.processedMembers} / {progress.totalMembers} ledamöter</span>
        <span className="font-medium">{progressPercentage}%</span>
      </div>
      <Progress value={progressPercentage} className="w-full" />
      
      {/* Chunk Progress Info */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="text-sm font-medium text-gray-800 mb-2">
          Chunk-framsteg
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="font-medium">Chunks slutförda:</span> {chunksCompleted} / {totalChunks}
          </div>
          <div>
            <span className="font-medium">Kvarvarande ledamöter:</span> {remainingMembers}
          </div>
        </div>
      </div>
      
      {progress.currentMember && progress.status === 'running' && (
        <div className="text-sm text-gray-600 animate-pulse">
          <span className="font-medium">Bearbetar just nu:</span> {progress.currentMember}
        </div>
      )}

      {/* Live RSS Items Counter */}
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm font-medium text-blue-800 mb-1">
          RSS-objekt Live-räkning
        </div>
        <div className="flex justify-between text-sm text-blue-700">
          <span>Totalt hämtade: <span className="font-bold">{progress.totalRssItems}</span></span>
          {progress.status === 'running' && progress.currentBatchRssItems > 0 && (
            <span className="animate-pulse">Senaste fetch: <span className="font-bold">{progress.currentBatchRssItems}</span></span>
          )}
        </div>
      </div>

      {/* Timing Information */}
      {progress.startTime && (
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Varaktighet:</span> {formatDuration(progress.startTime)}
          </div>
          {progress.estimatedCompletion && progress.status === 'running' && (
            <div>
              <span className="font-medium">Beräknad slutförd:</span> {progress.estimatedCompletion}
            </div>
          )}
          {lastUpdate && (
            <div>
              <span className="font-medium">Senast uppdaterad:</span> {lastUpdate.toLocaleTimeString('sv-SE')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
