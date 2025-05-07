import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss: () => void;
}

/**
 * Error message component
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  
  return (
    <div 
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded flex justify-between items-center" 
      role="alert"
      aria-live="assertive"
    >
      <p>{message}</p>
      <button 
        className="text-red-700 font-bold hover:text-red-900 ml-2 focus:outline-none focus:ring-2 focus:ring-red-500"
        onClick={onDismiss}
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
};

export default React.memo(ErrorMessage);
