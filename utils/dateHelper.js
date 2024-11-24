const dateHelper = {
    // Calculate days remaining until a date
    daysUntil: (date) => {
      const now = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
  
    // Format date for display
    formatDate: (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
  
    // Check if date is within range
    isWithinDays: (date, days) => {
      const now = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days && diffDays > 0;
    },
  
    // Add days to current date
    addDays: (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    }
  };
  
  module.exports = dateHelper;