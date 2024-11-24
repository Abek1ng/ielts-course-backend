const responseHelper = {
    // Success response
    success: (res, data, message = 'Success', statusCode = 200) => {
      return res.status(statusCode).json({
        success: true,
        message,
        data
      });
    },
  
    // Error response
    error: (res, message = 'Error occurred', statusCode = 500) => {
      return res.status(statusCode).json({
        success: false,
        message
      });
    },
  
    // Validation error response
    validationError: (res, errors) => {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    },
  
    // Unauthorized response
    unauthorized: (res, message = 'Unauthorized access') => {
      return res.status(401).json({
        success: false,
        message
      });
    },
  
    // Forbidden response
    forbidden: (res, message = 'Access forbidden') => {
      return res.status(403).json({
        success: false,
        message
      });
    }
  };
  
  module.exports = responseHelper;