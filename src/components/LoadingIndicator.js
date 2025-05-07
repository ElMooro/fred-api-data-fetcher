import React from 'react';

const LoadingIndicator = React.memo(({ message = "Loading..." }) => (
  <div className="h-full flex items-center justify-center" aria-busy="true" role="status">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

export default LoadingIndicator;
