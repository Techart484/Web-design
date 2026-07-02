const ResearchService = require('./research_service');
const JinaReaderService = require('./jina_reader_service');

/**
 * Failover Service - Implements Tavily → Jina → Firecrawl failover chain
 * Provides resilient scraping with automatic fallback
 */
class FailoverService {
  constructor() {
    this.tavilyService = new ResearchService();
    this.jinaService = new JinaReaderService();
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
    this.firecrawlBaseUrl =
      process.env.FIRECRAWL_API_URL || 'https://api.firecrawl.dev';
  }

  /**
   * Extract content with automatic failover
   * @param {string} url - URL to extract from
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction results with service used
   */
  async extractWithFailover(url, options = {}) {
    const services = ['tavily', 'jina', 'firecrawl'];
    let lastError = null;

    for (const service of services) {
      try {
        console.log(`Attempting extraction with ${service}...`);
        const result = await this._extractWithService(service, url, options);

        return {
          success: true,
          data: result,
          metadata: {
            service,
            url,
            extractedAt: new Date().toISOString(),
            fallbackChain: services.slice(services.indexOf(service)),
          },
        };
      } catch (error) {
        console.warn(`${service} extraction failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    // All services failed
    throw this._createError(
      503,
      `All extraction services failed. Last error: ${lastError?.message || 'Unknown error'}`,
    );
  }

  /**
   * Research with automatic failover
   * @param {string} query - Research query
   * @param {Object} options - Research options
   * @returns {Promise<Object>} Research results with service used
   */
  async researchWithFailover(query, options = {}) {
    const services = ['tavily', 'jina'];
    let lastError = null;

    for (const service of services) {
      try {
        console.log(`Attempting research with ${service}...`);
        const result = await this._researchWithService(service, query, options);

        return {
          success: true,
          data: result,
          metadata: {
            service,
            query,
            researchedAt: new Date().toISOString(),
            fallbackChain: services.slice(services.indexOf(service)),
          },
        };
      } catch (error) {
        console.warn(`${service} research failed: ${error.message}`);
        lastError = error;
        continue;
      }
    }

    // All services failed
    throw this._createError(
      503,
      `All research services failed. Last error: ${lastError?.message || 'Unknown error'}`,
    );
  }

  /**
   * Extract with specific service
   * @param {string} service - Service name
   * @param {string} url - URL to extract
   * @param {Object} options - Options
   * @returns {Promise<Object>} Extraction result
   * @private
   */
  async _extractWithService(service, url, options) {
    switch (service) {
      case 'tavily':
        return await this.tavilyService.extract(url, options);

      case 'jina':
        return await this.jinaService.extract(url, options);

      case 'firecrawl':
        return await this._extractWithFirecrawl(url, options);

      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * Research with specific service
   * @param {string} service - Service name
   * @param {string} query - Research query
   * @param {Object} options - Options
   * @returns {Promise<Object>} Research result
   * @private
   */
  async _researchWithService(service, query, options) {
    switch (service) {
      case 'tavily':
        return await this.tavilyService.search(query, options);

      case 'jina':
        // Jina doesn't support search, use extract instead
        if (this._isUrl(query)) {
          return await this.jinaService.extract(query, options);
        } else {
          throw new Error(
            'Jina Reader does not support search queries, only URL extraction',
          );
        }

      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }

  /**
   * Extract with Firecrawl API
   * @param {string} url - URL to extract
   * @param {Object} options - Options
   * @returns {Promise<Object>} Extraction result
   * @private
   */
  async _extractWithFirecrawl(url, options = {}) {
    if (!this.firecrawlApiKey) {
      throw new Error('FIRECRAWL_API_KEY not found in environment variables');
    }

    const endpoint = `${this.firecrawlBaseUrl}/v1/scrape`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: options.onlyMainContent !== false,
        includeTags: options.includeTags || [],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Firecrawl API error: ${data.error || response.statusText}`,
      );
    }

    return {
      success: true,
      data: {
        content: data.markdown || data.content || '',
        html: data.html || '',
        metadata: data.metadata || {},
      },
    };
  }

  /**
   * Deep content transformation with failover
   * @param {string} url - URL to transform
   * @param {Object} firecrawlData - Optional Firecrawl data for enrichment
   * @returns {Promise<Object>} Transformed content
   */
  async deepContentTransformation(url, firecrawlData = null) {
    try {
      // Try Jina Reader for deep content transformation
      return await this.jinaService.deepContentTransformation(
        url,
        firecrawlData,
      );
    } catch (error) {
      console.warn('Jina deep transformation failed, trying Tavily extract...');

      try {
        const tavilyResult = await this.tavilyService.extract(url, {
          extract_depth: 'advanced',
        });

        return {
          success: true,
          data: {
            content: tavilyResult.results?.[0]?.content || '',
            firecrawlEnrichment: firecrawlData,
          },
          metadata: {
            transformationType: 'deep_content',
            sources: ['tavily', ...(firecrawlData ? ['firecrawl'] : [])],
            transformedAt: new Date().toISOString(),
          },
        };
      } catch (fallbackError) {
        throw this._createError(
          503,
          `Deep content transformation failed: ${fallbackError.message}`,
        );
      }
    }
  }

  /**
   * Check if input is a URL
   * @param {string} input - Input string
   * @returns {boolean} Is URL
   * @private
   */
  _isUrl(input) {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create standardized error object
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Error message
   * @returns {Error} Formatted error
   * @private
   */
  _createError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.service = 'failover_service';
    return error;
  }

  /**
   * Validate failover service configuration
   * @returns {Promise<Object>} Validation results
   */
  async validateConfiguration() {
    const results = {
      tavily: false,
      jina: false,
      firecrawl: false,
    };

    try {
      results.tavily = await this.tavilyService.validateConnection();
    } catch (error) {
      console.error('Tavily validation failed:', error.message);
    }

    try {
      results.jina = await this.jinaService.validateConfiguration();
    } catch (error) {
      console.error('Jina validation failed:', error.message);
    }

    results.firecrawl = !!this.firecrawlApiKey;

    return {
      success: Object.values(results).some((v) => v),
      services: results,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = FailoverService;
