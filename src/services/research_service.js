require('dotenv').config();

/**
 * Research Service - Tavily API Integration
 * Provides modular methods for search, crawl, extract, and research operations
 */
class ResearchService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    this.baseUrl = 'https://api.tavily.com';
    
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY not found in environment variables');
    }
  }

  /**
   * Perform a search query
   * @param {string} query - Search query
   * @param {Object} options - Additional search options
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    const endpoint = `${this.baseUrl}/search`;
    const body = {
      api_key: this.apiKey,
      query,
      search_depth: options.search_depth || 'basic',
      max_results: options.max_results || 10,
      include_answer: options.include_answer || true,
      include_raw_content: options.include_raw_content || false,
      include_images: options.include_images || false,
    };

    return this._makeRequest(endpoint, body);
  }

  /**
   * Crawl a specific URL
   * @param {string} url - URL to crawl
   * @param {Object} options - Additional crawl options
   * @returns {Promise<Object>} Crawled content
   */
  async crawl(url, options = {}) {
    const endpoint = `${this.baseUrl}/crawl`;
    const body = {
      api_key: this.apiKey,
      url,
      query: options.query || '',
      max_depth: options.max_depth || 1,
      max_pages: options.max_pages || 1,
      extract_depth: options.extract_depth || 'advanced',
      include_backlinks: options.include_backlinks || false,
    };

    return this._makeRequest(endpoint, body);
  }

  /**
   * Extract content from a URL
   * @param {string} url - URL to extract from
   * @param {Object} options - Additional extract options
   * @returns {Promise<Object>} Extracted content
   */
  async extract(url, options = {}) {
    const endpoint = `${this.baseUrl}/extract`;
    const body = {
      api_key: this.apiKey,
      urls: [url],
      extract_depth: options.extract_depth || 'advanced',
      include_images: options.include_images || false,
    };

    return this._makeRequest(endpoint, body);
  }

  /**
   * Perform comprehensive research
   * @param {string} query - Research query
   * @param {Object} options - Additional research options
   * @returns {Promise<Object>} Research results
   */
  async research(query, options = {}) {
    const endpoint = `${this.baseUrl}/search`;
    const body = {
      api_key: this.apiKey,
      query,
      search_depth: options.search_depth || 'advanced',
      max_results: options.max_results || 10,
      include_answer: options.include_answer || true,
      include_raw_content: options.include_raw_content || true,
      include_images: options.include_images || false,
      include_domains: options.include_domains || [],
      exclude_domains: options.exclude_domains || [],
      days: options.days || 3,
      max_tokens: options.max_tokens || 4000,
    };

    return this._makeRequest(endpoint, body);
  }

  /**
   * Make HTTP request to Tavily API
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @returns {Promise<Object>} Response data
   * @private
   */
  async _makeRequest(endpoint, body) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Tavily API error: ${data.message || response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`Research Service Error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate API key and connection
   * @returns {Promise<boolean>} Connection status
   */
  async validateConnection() {
    try {
      await this.search('test', { max_results: 1 });
      return true;
    } catch (error) {
      console.error('Tavily API connection failed:', error.message);
      return false;
    }
  }
}

module.exports = ResearchService;
