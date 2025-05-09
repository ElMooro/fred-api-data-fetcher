import React from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="error-container">
      <h2>Something went wrong</h2>
      <p>We're sorry, but an error occurred while trying to display this content.</p>
      <div className="error-details">
        <p>{error.message}</p>
      </div>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

export default ErrorFallback;
