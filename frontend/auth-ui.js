// Authentication UI Helper
// Include this script on pages that need to show/hide elements based on auth status

(function() {
  'use strict';

  // Check if user is authenticated
  function checkAuth() {
    const auth = AuthService.getAuth();
    return auth.isAuthenticated;
  }

  // Get current user
  function getCurrentUser() {
    const auth = AuthService.getAuth();
    return auth.user;
  }

  // Update navigation based on auth status
  function updateNavigation() {
    const isAuthenticated = checkAuth();
    const user = getCurrentUser();

    // Find login/logout buttons
    const loginButtons = document.querySelectorAll('[data-auth="login"]');
    const logoutButtons = document.querySelectorAll('[data-auth="logout"]');
    const userInfo = document.querySelectorAll('[data-auth="user-info"]');

    if (isAuthenticated && user) {
      // Hide login buttons
      loginButtons.forEach(btn => btn.style.display = 'none');
      
      // Show logout buttons
      logoutButtons.forEach(btn => {
        btn.style.display = '';
        btn.addEventListener('click', handleLogout);
      });
      
      // Show user info
      userInfo.forEach(el => {
        el.style.display = '';
        el.textContent = `Welcome, ${user.name}`;
      });
    } else {
      // Show login buttons
      loginButtons.forEach(btn => btn.style.display = '');
      
      // Hide logout buttons
      logoutButtons.forEach(btn => btn.style.display = 'none');
      
      // Hide user info
      userInfo.forEach(el => el.style.display = 'none');
    }
  }

  // Handle logout
  async function handleLogout(e) {
    e.preventDefault();
    
    if (confirm('Are you sure you want to logout?')) {
      try {
        await AuthService.logout();
        window.location.href = 'login.html';
      } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
      }
    }
  }

  // Protect page (redirect to login if not authenticated)
  function protectPage() {
    if (!checkAuth()) {
      window.location.href = 'login.html';
    }
  }

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    // Check if page requires authentication
    if (document.body.hasAttribute('data-require-auth')) {
      protectPage();
    }
    
    // Update navigation
    updateNavigation();
  });

  // Export functions for global use
  window.AuthUI = {
    checkAuth,
    getCurrentUser,
    updateNavigation,
    protectPage,
    logout: handleLogout
  };

})();
