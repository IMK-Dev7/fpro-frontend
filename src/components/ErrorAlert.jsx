import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorAlert = ({ message, onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="text-red-500 mt-0.5 mr-3" size={20} />
        <div className="flex-1">
          <p className="text-red-800">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;