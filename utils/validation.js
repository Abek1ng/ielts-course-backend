// Validation helper functions
const validation = {
    // Validate email format
    isValidEmail: (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    },
  
    // Validate username format
    isValidUsername: (username) => {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      return usernameRegex.test(username);
    },
  
    // Validate password strength
    isStrongPassword: (password) => {
      return password.length >= 6;
    },
  
    // Validate registration input
    validateRegistration: (data) => {
      const errors = [];
  
      if (!data.username || !validation.isValidUsername(data.username)) {
        errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
      }
  
      if (!data.email || !validation.isValidEmail(data.email)) {
        errors.push('Please provide a valid email address');
      }
  
      if (!data.password || !validation.isStrongPassword(data.password)) {
        errors.push('Password must be at least 6 characters long');
      }
  
      return {
        isValid: errors.length === 0,
        errors
      };
    },
  
    // Validate access duration
    validateAccessDuration: (days) => {
      const numDays = parseInt(days);
      return !isNaN(numDays) && numDays > 0 && numDays <= 365;
    }
  };
  
  module.exports = validation;