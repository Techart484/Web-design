const ResearchService = require('./research_service');

/**
 * Intake Service - Handles incoming user data and orchestrates research
 * Accepts URL and predicament, passes to Research Service for analysis
 */
class IntakeService {
  constructor() {
    this.researchService = new ResearchService();
  }

  /**
   * Process user intake - URL and predicament
   * @param {string} url - Target URL to analyze
   * @param {string} predicament - User's business predicament/context
   * @param {Object} options - Additional processing options
   * @returns {Promise<Object>} Processed research results
   */
  async processIntake(url, predicament, options = {}) {
    try {
      // Validate inputs
      if (!url) {
        throw new Error('URL is required for intake processing');
      }
      if (!predicament) {
        throw new Error('Predicament is required for intake processing');
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid URL format provided');
      }

      // Step 1: Extract content from the URL
      console.log(`Extracting content from: ${url}`);
      const extractResults = await this.researchService.extract(url, {
        extract_depth: options.extract_depth || 'advanced',
      });

      // Step 2: Perform research based on predicament
      console.log(`Performing research for predicament: ${predicament}`);
      const researchQuery = this._buildResearchQuery(url, predicament);
      const researchResults = await this.researchService.research(researchQuery, {
        search_depth: options.search_depth || 'advanced',
        max_results: options.max_results || 10,
        days: options.days || 7,
      });

      // Step 3: Combine and format results
      const processedResults = this._formatResults(extractResults, researchResults, url, predicament);

      return {
        success: true,
        data: processedResults,
        metadata: {
          url,
          predicament,
          processedAt: new Date().toISOString(),
          extractResultsCount: extractResults.results?.length || 0,
          researchResultsCount: researchResults.results?.length || 0,
        },
      };
    } catch (error) {
      console.error(`Intake Service Error: ${error.message}`);
      
      // Check for rate limit or API errors
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        throw new Error(`Rate limit exceeded: ${error.message}`);
      }
      
      if (error.message.includes('API error') || error.message.includes('401')) {
        throw new Error(`API authentication failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Build research query from URL and predicament
   * @param {string} url - Target URL
   * @param {string} predicament - User predicament
   * @returns {string} Formatted research query
   * @private
   */
  _buildResearchQuery(url, predicament) {
    const domain = new URL(url).hostname;
    return `${predicament} site:${domain} business analysis`;
  }

  /**
   * Format combined results for downstream processing
   * @param {Object} extractResults - URL extraction results
   * @param {Object} researchResults - Research results
   * @param {string} url - Original URL
   * @param {string} predicament - Original predicament
   * @returns {Object} Formatted results
   * @private
   */
  _formatResults(extractResults, researchResults, url, predicament) {
    return {
      source: {
        url,
        predicament,
        domain: new URL(url).hostname,
      },
      extraction: {
        title: extractResults.results?.[0]?.title || '',
        content: extractResults.results?.[0]?.content || '',
        metadata: extractResults.results?.[0]?.metadata || {},
      },
      research: {
        answer: researchResults.answer || '',
        results: researchResults.results || [],
        query: researchResults.query || '',
      },
      summary: this._generateSummary(extractResults, researchResults, predicament),
    };
  }

  /**
   * Generate summary of findings
   * @param {Object} extractResults - Extraction results
   * @param {Object} researchResults - Research results
   * @param {string} predicament - User predicament
   * @returns {string} Summary text
   * @private
   */
  _generateSummary(extractResults, researchResults, predicament) {
    const title = extractResults.results?.[0]?.title || 'Unknown';
    const answer = researchResults.answer || 'No direct answer available';
    
    return `Analysis of ${title} regarding: ${predicament}. Key findings: ${answer.substring(0, 500)}...`;
  }

  /**
   * Validate intake service configuration
   * @returns {Promise<boolean>} Validation status
   */
  async validateConfiguration() {
    try {
      const isValid = await this.researchService.validateConnection();
      return isValid;
    } catch (error) {
      console.error('Intake Service configuration validation failed:', error.message);
      return false;
    }
  }
}

module.exports = IntakeService;
