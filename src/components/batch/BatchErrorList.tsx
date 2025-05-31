
import React from 'react';
import { BatchError } from '../../types/batch';

interface BatchErrorListProps {
  errors: BatchError[];
}

export const BatchErrorList: React.FC<BatchErrorListProps> = ({ errors }) => {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-red-600">Senaste fel ({errors.length})</h4>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {errors.slice(-5).map((error, index) => (
          <div key={index} className="text-sm bg-red-50 p-2 rounded border border-red-200">
            <span className="font-medium">{error.memberName}:</span> {error.error}
          </div>
        ))}
        {errors.length > 5 && (
          <div className="text-xs text-gray-500 text-center">
            ... och {errors.length - 5} fler fel
          </div>
        )}
      </div>
    </div>
  );
};
