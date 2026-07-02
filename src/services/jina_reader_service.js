require('dotenv').config();

/**
 * Jina Reader Service - Fallback scraper for Deep Content Transformation
 * Used when Firecrawl needs structured text enrichment
 */
class JinaReaderService {
  constructor() {
    this.baseUrl = 'https://r.jina.ai/http://';
    this.httpsBaseUrl = 'https://r.jina.ai/https://';
  }

  /**
   * Extract structured text from URL using Jina Reader
   * @param {string} url - URL to extract from
   * @returns {Promise<Object>} Extracted content
   */
  async extract(url) {
    try {
      if (!url) {
        throw new Error('URL is required for Jina Reader extraction');
      }

      // Format URL for Jina Reader
      const jinaUrl = this._formatUrl(url);

      console.log(`Jina Reader extracting: ${jinaUrl}`);

      const response = await fetch(jinaUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Webify/1.0)',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Jina Reader API error: ${response.status} ${response.statusText}`,
        );
      }

      const text = await response.text();

      return {
        success: true,
        data: {
          url,
          content: text,
          extractedAt: new Date().toISOString(),
          source: 'jina_reader',
        },
      };
    } catch (error) {
      console.error(`Jina Reader Service Error: ${error.message}`);
      throw this._createError(
        503,
        `Jina Reader extraction failed: ${error.message}`,
      );
    }
  }

  /**
   * Perform deep content transformation
   * Enriches Firecrawl output with structured text
   * @param {string} url - URL to transform
   * @param {Object} firecrawlData - Data from Firecrawl for enrichment
   * @returns {Promise<Object>} Transformed content
   */
  async deepContentTransformation(url, firecrawlData = null) {
    try {
      const jinaResult = await this.extract(url);

      // Combine with Firecrawl data if provided
      const enrichedData = {
        ...jinaResult.data,
        firecrawlEnrichment: firecrawlData
          ? {
              metadata: firecrawlData.metadata || {},
              additionalContent: firecrawlData.content || '',
            }
          : null,
      };

      return {
        success: true,
        data: enrichedData,
        metadata: {
          transformationType: 'deep_content',
          sources: ['jina_reader', ...(firecrawlData ? ['firecrawl'] : [])],
          transformedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`Deep Content Transformation Error: ${error.message}`);
      throw this._createError(
        503,
        `Deep content transformation failed: ${error.message}`,
      );
    }
  }

  /**
   * Batch extract from multiple URLs
   * @param {Array<string>} urls - Array of URLs to extract
   * @returns {Promise<Array>} Array of extraction results
   */
  async batchExtract(urls) {
    try {
      const results = await Promise.allSettled(
        urls.map((url) => this.extract(url)),
      );

      return results.map((result, index) => ({
        url: urls[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value.data : null,
        error: result.status === 'rejected' ? result.reason.message : null,
      }));
    } catch (error) {
      console.error(`Batch Extract Error: ${error.message}`);
      throw this._createError(503, `Batch extraction failed: ${error.message}`);
    }
  }

  /**
   * Format URL for Jina Reader API
   * @param {string} url - Original URL
   * @returns {string} Formatted Jina URL
   * @private
   */
  _formatUrl(url) {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === 'https:') {
        return `${this.httpsBaseUrl}${urlObj.hostname}${urlObj.pathname}${urlObj.search}`;
      }
      return `${this.baseUrl}${urlObj.hostname}${urlObj.pathname}${urlObj.search}`;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
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
    error.service = 'jina_reader';
    return error;
  }

  /**
   * Validate Jina Reader configuration
   * @returns {Promise<boolean>} Validation status
   */
  async validateConfiguration() {
    try {
      // Test with a simple URL
      const testUrl = 'https://example.com';
      await this.extract(testUrl);
      return true;
    } catch (error) {
      console.error(
        'Jina Reader configuration validation failed:',
        error.message,
      );
      return false;
    }
  }
}

module.exports = JinaReaderService;
