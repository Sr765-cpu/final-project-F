// Authentication Service
const AuthService = {
  API_URL: 'http://localhost:4000/api',
  
  // Get stored auth data
  getAuth() {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const user = localStorage.getItem('user');
    
    return {
      token,
      refreshToken,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token
    };
  },
  
  // Save auth data
  saveAuth(token, refreshToken, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Clear auth data
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },
  
  // Register new user
  async register(data) {
    try {
      const response = await fetch(`${this.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      // Save auth data
      this.saveAuth(result.token, result.refreshToken, result.user);
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Login user
  async login(data) {
    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      
      // Save auth data
      this.saveAuth(result.token, result.refreshToken, result.user);
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Logout user
  async logout() {
    try {
      const { token } = this.getAuth();
      
      if (token) {
        await fetch(`${this.API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  },
  
  // Refresh access token
  async refreshToken() {
    try {
      const { refreshToken } = this.getAuth();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await fetch(`${this.API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Token refresh failed');
      }
      
      // Update tokens
      const { user } = this.getAuth();
      this.saveAuth(result.token, result.refreshToken, user);
      
      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      throw error;
    }
  },
  
  // Get current user profile
  async getProfile() {
    try {
      const { token } = this.getAuth();
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(`${this.API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Try to refresh token if unauthorized
        if (response.status === 401) {
          await this.refreshToken();
          return this.getProfile(); // Retry with new token
        }
        throw new Error(result.message || 'Failed to get profile');
      }
      
      // Update stored user data
      const auth = this.getAuth();
      this.saveAuth(auth.token, auth.refreshToken, result.user);
      
      return result.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },
  
  // Make authenticated API request
  async authenticatedFetch(url, options = {}) {
    const { token } = this.getAuth();
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    try {
      const response = await fetch(url, { ...options, headers });
      
      // Try to refresh token if unauthorized
      if (response.status === 401) {
        await this.refreshToken();
        
        // Retry request with new token
        const newAuth = this.getAuth();
        headers.Authorization = `Bearer ${newAuth.token}`;
        return fetch(url, { ...options, headers });
      }
      
      return response;
    } catch (error) {
      console.error('Authenticated fetch error:', error);
      throw error;
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
