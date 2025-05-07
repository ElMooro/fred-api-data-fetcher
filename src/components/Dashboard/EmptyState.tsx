import React from 'react';

interface EmptyStateProps {
  message: string;
  action?: () => void;
  actionLabel?: string;
}

/**
 * Empty state component
 */
const EmptyState: React.FC<EmptyStateProps> = ({ message, action, actionLabel }) => (
  <div className="h-full flex items-center justify-center">
    <div className="bg-gray-50 p-8 rounded-lg text-center max-w-md">
      <p className="text-gray-500 mb-4">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

export default React.memo(EmptyState);
