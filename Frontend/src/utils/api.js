// API Configuration and utilities
// Prefer Vite env if provided, else fall back to sensible defaults
let API_BASE_URL = null;
try {
  // In Vite, import.meta.env is statically injected at build time
  // eslint-disable-next-line no-undef
  API_BASE_URL = (import.meta && import.meta.env && import.meta.env.VITE_API_BASE_URL) || null;
} catch (_) {
  // ignore
}

if (!API_BASE_URL) {
  API_BASE_URL = '/api';
}

// API client with error handling
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Failed to parse JSON:', text);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication APIs
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Tax Calculation APIs
  async createTaxCalculation(calculationData) {
    return this.request('/tax-calculations', {
      method: 'POST',
      body: JSON.stringify(calculationData),
    });
  }

  async getTaxCalculations() {
    return this.request('/tax-calculations');
  }

  async compareTaxRegimes(comparisonData) {
    return this.request('/tax-calculations/compare', {
      method: 'POST',
      body: JSON.stringify(comparisonData),
    });
  }

  async getTaxStats() {
    return this.request('/tax-calculations/stats/summary');
  }

  // Enhanced Tax Calculation APIs
  async calculateEnhancedTax(taxData) {
    return this.request('/enhanced-tax/calculate', {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  async compareEnhancedRegimes(taxData) {
    return this.request('/enhanced-tax/compare-regimes', {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  async calculateFromForm16(form16Data) {
    return this.request('/enhanced-tax/from-form16', {
      method: 'POST',
      body: JSON.stringify(form16Data),
    });
  }

  async getTaxSuggestions(taxData) {
    return this.request('/enhanced-tax/suggestions', {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  // Document APIs
  async uploadDocument(formData) {
    const url = `${this.baseURL}/documents/upload`;
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async processDocument(documentId) {
    return this.request(`/documents/${documentId}/process`, {
      method: 'POST',
    });
  }

  async getDocuments() {
    return this.request('/documents');
  }

  async getDocument(documentId) {
    return this.request(`/documents/${documentId}`);
  }

  async downloadDocument(documentId) {
    const url = `${this.baseURL}/documents/${documentId}/download`;
    const headers = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return fetch(url, { headers });
  }

  // AI Assistant APIs
  async sendAIQuery(queryData) {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify(queryData),
    });
  }

  async getAIHistory() {
    return this.request('/ai/history');
  }

  async submitAIFeedback(queryId, feedback) {
    return this.request(`/ai/query/${queryId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  async getAIMetrics() {
    return this.request('/ai/metrics');
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for use in components
export default apiClient;

// Export individual methods for convenience
export const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  createTaxCalculation,
  getTaxCalculations,
  compareTaxRegimes,
  getTaxStats,
  calculateEnhancedTax,
  compareEnhancedRegimes,
  calculateFromForm16,
  getTaxSuggestions,
  uploadDocument,
  processDocument,
  getDocuments,
  getDocument,
  downloadDocument,
  sendAIQuery,
  getAIHistory,
  submitAIFeedback,
  getAIMetrics,
  checkHealth,
  setAuthToken,
} = apiClient;