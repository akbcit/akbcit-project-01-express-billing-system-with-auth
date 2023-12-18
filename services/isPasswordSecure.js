function isPasswordSecure(password) {
    // check for minimum length
    if (password.length < 8) {
      return false;
    }
  
    // check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }
  
    // check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }
  
    // check for at least one digit
    if (!/[0-9]/.test(password)) {
      return false;
    }
  
    // check for at least one special character
    if (!/[!@#$%^&*]/.test(password)) {
      return false;
    }
  
    // If all criteria are met, return true
    return true;
  }

  module.exports = isPasswordSecure;