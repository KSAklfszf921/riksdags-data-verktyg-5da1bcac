
import React from 'react';
import { Button } from '../ui/button';
import { RefreshCw, Play, Square } from 'lucide-react';

interface BatchControlsProps {
  status: string;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
}

export const BatchControls: React.FC<BatchControlsProps> = ({
  status,
  onStart,
  onStop,
  onRefresh
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={status === 'running'}
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
      {status === 'running' ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={onStop}
        >
          <Square className="w-4 h-4 mr-1" />
          Stoppa
        </Button>
      ) : (
        <Button
          variant="default"
          size="sm"
          onClick={onStart}
          disabled={status === 'running'}
        >
          <Play className="w-4 h-4 mr-1" />
          Starta
        </Button>
      )}
    </div>
  );
};
