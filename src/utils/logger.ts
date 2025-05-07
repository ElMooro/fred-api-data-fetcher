/**
 * Logger utility with multiple log levels and environment awareness
 */
const Logger = (() => {
  const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };
  
  // Set minimum log level based on environment
  const MIN_LOG_LEVEL = process.env.NODE_ENV === 'production' 
    ? LOG_LEVELS.WARN 
    : LOG_LEVELS.DEBUG;
  
  // Format message based on level and include timestamp
  const formatMessage = (level: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const formattedData = data ? JSON.stringify(data, null, 2) : '';
    return `[${timestamp}] [${level}] ${message} ${formattedData}`;
  };
  
  return {
    debug: (message: string, data?: any) => {
      if (MIN_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
        console.debug(formatMessage('DEBUG', message, data));
      }
    },
    info: (message: string, data?: any) => {
      if (MIN_LOG_LEVEL <= LOG_LEVELS.INFO) {
        console.info(formatMessage('INFO', message, data));
      }
    },
    warn: (message: string, data?: any) => {
      if (MIN_LOG_LEVEL <= LOG_LEVELS.WARN) {
        console.warn(formatMessage('WARN', message, data));
      }
    },
    error: (message: string, error?: Error | string, extraData?: any) => {
      if (MIN_LOG_LEVEL <= LOG_LEVELS.ERROR) {
        console.error(
          formatMessage('ERROR', message, { 
            error: typeof error === 'string' ? error : error?.message, 
            stack: typeof error !== 'string' ? error?.stack : undefined,
            ...extraData 
          })
        );
      }
    }
  };
})();

export default Logger;
