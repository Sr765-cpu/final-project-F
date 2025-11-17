// Login Page JavaScript
(function() {
  'use strict';

  // State
  let currentAuthMode = 'login';
  let currentRole = 'organizer';
  let redirectTarget = 'dashboard2.html';
  let hasRedirectParam = false;

  // Add entrance animation to container
  const container = document.querySelector('.login-container');
  if (container) {
    container.style.opacity = '0';
    container.style.transform = 'translateY(30px)';
    setTimeout(() => {
      container.style.transition = 'all 0.6s ease-out';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
    }, 100);
  }

  // Elements
  const loginSelect = document.getElementById('login-select');
  const loginForm = document.getElementById('login-form');
  const authTabs = document.querySelectorAll('.auth-tab');
  const roleButtons = document.querySelectorAll('[data-role]');
  const backToSelect = document.getElementById('back-to-select');
  const roleToggle = document.getElementById('role-toggle');
  const roleLabel = document.getElementById('role-label');
  const switchRoleBtn = document.getElementById('switch-role-btn');
  const pwToggle = document.getElementById('pw-toggle');
  const passwordInput = document.getElementById('password');
  const goSignup = document.getElementById('go-signup');
  const switchAuthText = document.getElementById('switch-auth-text');
  const signupOnly = document.getElementById('signup-only');
  const submitBtn = document.getElementById('submit-btn');

  // Read role and redirect from URL for dedicated detailed login page (e.g., login-details.html?role=organizer&redirect=communication.html)
  try {
    const params = new URLSearchParams(window.location.search);
    const roleFromUrl = params.get('role');
    const redirectFromUrl = params.get('redirect');
    if (roleFromUrl === 'organizer' || roleFromUrl === 'participant') {
      currentRole = roleFromUrl;
    }
    if (redirectFromUrl) {
      redirectTarget = redirectFromUrl;
      hasRedirectParam = true;
    }
  } catch (e) {
    // ignore malformed URL
  }

  if (roleLabel) {
    roleLabel.textContent = currentRole === 'organizer' ? 'Organizer' : 'Participant';
  }

  // Initial visibility: show only role selection card
  if (loginSelect && loginForm) {
    loginSelect.hidden = false;
    loginForm.hidden = true;
  }

  // Auth mode tabs
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // If user clicks on the Sign Up tab, go to the dedicated register page
      if (tab.dataset.authMode === 'signup') {
        window.location.href = 'register.html';
        return;
      }

      authTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentAuthMode = tab.dataset.authMode;
      updateAuthMode();
    });
  });

  // Role selection on compact card → navigate to detailed login page, preserving redirect if present
  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const roleParam = btn.dataset.role === 'participant' ? 'participant' : 'organizer';
      let nextUrl = `login-details.html?role=${encodeURIComponent(roleParam)}`;
      if (hasRedirectParam && redirectTarget) {
        nextUrl += `&redirect=${encodeURIComponent(redirectTarget)}`;
      }
      window.location.href = nextUrl;
    });
  });

  // Back to selection
  if (backToSelect) {
    backToSelect.addEventListener('click', () => {
      if (loginSelect) {
        loginForm.hidden = true;
        loginSelect.hidden = false;
      } else {
        // On dedicated role login page, return to compact role selector
        window.location.href = 'login.html';
      }
    });
  }

  // Role toggle in form
  if (roleToggle && roleLabel) {
    roleToggle.addEventListener('click', () => {
      currentRole = currentRole === 'organizer' ? 'participant' : 'organizer';
      roleLabel.textContent = currentRole === 'organizer' ? 'Organizer' : 'Participant';
    });
  }

  // Switch role button
  if (switchRoleBtn && roleLabel) {
    switchRoleBtn.addEventListener('click', () => {
      currentRole = currentRole === 'organizer' ? 'participant' : 'organizer';
      roleLabel.textContent = currentRole === 'organizer' ? 'Organizer' : 'Participant';
    });
  }

  // Password toggle
  if (pwToggle && passwordInput) {
    pwToggle.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        pwToggle.textContent = '🙈';
      } else {
        passwordInput.type = 'password';
        pwToggle.textContent = '👁️';
      }
    });
  }

  // Switch to signup -> redirect to standalone register page
  if (goSignup) {
    goSignup.addEventListener('click', () => {
      window.location.href = 'register.html';
    });
  }

  // Update auth mode UI
  function updateAuthMode() {
    if (currentAuthMode === 'signup') {
      // Keep signup-only fields hidden; we use only Google sign-in
      signupOnly.hidden = true;
      switchAuthText.innerHTML = 'Already have an account? <button type="button" class="link" id="go-login">Login</button>';
      submitBtn.textContent = 'Sign Up';
      
      // Re-attach login link handler
      const goLogin = document.getElementById('go-login');
      goLogin.addEventListener('click', () => {
        currentAuthMode = 'login';
        authTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
          if (t.dataset.authMode === 'login') {
            t.classList.add('active');
            t.setAttribute('aria-selected', 'true');
          }
        });
        updateAuthMode();
      });
    } else {
      // Keep signup-only fields hidden in login mode as well
      signupOnly.hidden = true;
      switchAuthText.innerHTML = 'New to EventNest? <button type="button" class="link" id="go-signup-new">Create Account</button>';
      submitBtn.textContent = 'Continue';

      // Attach signup link handler to go to dedicated register page
      const goSignupNew = document.getElementById('go-signup-new');
      if (goSignupNew) {
        goSignupNew.addEventListener('click', () => {
          window.location.href = 'register.html';
        });
      }
    }
  }

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'error' ? '#ff4444' : type === 'success' ? '#00C851' : '#33b5e5'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
      word-wrap: break-word;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Validate form
  function validateForm(data) {
    const errors = [];
    
    if (currentAuthMode === 'signup') {
      if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
      }
      if (!data.address || data.address.trim().length < 5) {
        errors.push('Address must be at least 5 characters');
      }
    }
    
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!data.password) {
      errors.push('Password is required');
    } else if (currentAuthMode === 'signup') {
      if (data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(data.password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(data.password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/[0-9]/.test(data.password)) {
        errors.push('Password must contain at least one number');
      }
    }
    
    return errors;
  }

  // Form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check if AuthService is available
    if (typeof AuthService === 'undefined') {
      showNotification('Authentication service not loaded. Please refresh the page.', 'error');
      console.error('AuthService is not defined');
      return;
    }
    
    const formData = new FormData(loginForm);
    const data = {
      role: currentRole === 'organizer' ? 'user' : 'participant',
      email: formData.get('email')?.trim(),
      password: formData.get('password')
    };

    if (currentAuthMode === 'signup') {
      data.name = formData.get('name')?.trim();
      data.address = formData.get('address')?.trim();
    }

    // Validate form
    const errors = validateForm(data);
    if (errors.length > 0) {
      showNotification(errors.join('. '), 'error');
      return;
    }

    // Disable submit button and show loading
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = currentAuthMode === 'login' ? 'Logging in...' : 'Creating account...';

    try {
      let result;
      
      if (currentAuthMode === 'login') {
        console.log('Attempting login with:', { email: data.email, role: data.role });
        result = await AuthService.login(data);
        console.log('Login successful:', result);
        showNotification(`Welcome back, ${result.user.name}!`, 'success');
      } else {
        console.log('Attempting registration with:', { email: data.email, role: data.role, name: data.name });
        result = await AuthService.register(data);
        console.log('Registration successful:', result);
        showNotification(`Account created successfully! Welcome, ${result.user.name}!`, 'success');
      }
      
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = redirectTarget || 'dashboard2.html';
      }, 1500);
      
    } catch (error) {
      console.error('Auth error:', error);
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
      
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // Google login via Clerk
  const googleBtn = document.getElementById('google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        if (!window.Clerk) {
          showNotification('Sign-in service is still loading. Please try again in a moment.', 'error');
          return;
        }

        // Ensure Clerk JS is initialized
        await window.Clerk.load();

        // Start Google OAuth sign-in using Clerk, preserving redirect target if present
        const redirectUrl = hasRedirectParam && redirectTarget
          ? `dashboard2.html?redirect=${encodeURIComponent(redirectTarget)}`
          : 'dashboard2.html';

        await window.Clerk.redirectToSignIn({
          strategy: 'oauth_google',
          redirectUrl,
        });
      } catch (error) {
        console.error('Clerk Google sign-in error:', error);
        showNotification('Could not start Google sign-in. Please try again.', 'error');
      }
    });
  }

})();
