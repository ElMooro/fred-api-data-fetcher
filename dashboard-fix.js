  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Use the data service to fetch data
  const fetchData = useCallback(() => {
    setIsLoading(true);
    setError('');
    
    // Validate inputs before making request
    try {
      validateDateRange(startDate, endDate);
    } catch (validationError) {
      setError(validationError.message);
      setIsLoading(false);
      return;
    }
    
    const indicatorDetails = getIndicatorDetails();
    if (!indicatorDetails) {
      setError("Invalid indicator selected");
      setIsLoading(false);
      return;
    }
    
    // Use the data service to fetch data
    DataService.fetchData(
      selectedIndicator,
      indicatorDetails.frequency || 'monthly',
      startDate,
      endDate
    )
      .then(data => {
        setRawData(data);
        setLastUpdated(new Date());
        setIsLoading(false);
      })
      .catch(error => {
        setError(error instanceof AppError ? error.message : ERROR_MESSAGES.GENERAL_ERROR);
        setIsLoading(false);
        // Don't clear existing data on error to maintain partial functionality
      });
  }, [selectedIndicator, getIndicatorDetails, startDate, endDate]);
