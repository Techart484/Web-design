const ResearchService = require('./research_service');
const fs = require('fs');
const path = require('path');

/**
 * Intake Service - Handles incoming user data and orchestrates research
 * Accepts URL and business description, uses Gemini API to analyze business "Soul"
 * and map to pre-defined niches, then feeds into main pipeline
 */
class IntakeService {
  constructor() {
    this.researchService = new ResearchService();
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.nichesConfig = this._loadNichesConfig();

    if (!this.geminiApiKey) {
      console.warn(
        'GEMINI_API_KEY not found in environment variables. Gemini analysis will be skipped.',
      );
    }
  }

  /**
   * Load niches configuration
   * @returns {Object} Niches configuration
   * @private
   */
  _loadNichesConfig() {
    try {
      const configPath = path.join(process.cwd(), 'config', 'niches.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      console.error('Failed to load niches configuration:', error.message);
      return {
        _meta: {
          supported_niches: ['medical', 'legal', 'home-services', 'restaurant'],
          default_niche: 'medical',
        },
        keywords: {},
      };
    }
  }

  /**
   * Process user intake - URL and business description
   * @param {string} url - Target URL to analyze
   * @param {string} businessDescription - User's business description
   * @param {Object} options - Additional processing options
   * @returns {Promise<Object>} Processed research results with niche mapping
   */
  async processIntake(url, businessDescription, options = {}) {
    try {
      // Validate inputs
      if (!url) {
        throw new Error('URL is required for intake processing');
      }
      if (!businessDescription) {
        throw new Error(
          'Business description is required for intake processing',
        );
      }

      // Validate URL format
      try {
        new URL(url);
      } catch (error) {
        throw new Error('Invalid URL format provided');
      }

      // Step 1: Analyze business "Soul" using Gemini API
      console.log(`Analyzing business soul for: ${url}`);
      const nicheMapping = await this._analyzeBusinessSoul(
        url,
        businessDescription,
      );

      // Step 2: Extract content from the URL using Tavily orchestrator
      console.log(`Extracting content from: ${url}`);
      const extractResults = await this.researchService.orchestrate(
        url,
        'specific',
        {
          extract_depth: options.extract_depth || 'advanced',
        },
      );

      // Step 3: Perform research based on business description
      console.log(`Performing research for business: ${businessDescription}`);
      const researchQuery = this._buildResearchQuery(url, businessDescription);
      const researchResults = await this.researchService.orchestrate(
        researchQuery,
        'deep',
        {
          search_depth: options.search_depth || 'advanced',
          max_results: options.max_results || 10,
          days: options.days || 7,
        },
      );

      // Step 4: Combine and format results with niche mapping
      const processedResults = this._formatResults(
        extractResults,
        researchResults,
        url,
        businessDescription,
        nicheMapping,
      );

      return {
        success: true,
        data: processedResults,
        metadata: {
          url,
          businessDescription,
          niche: nicheMapping.niche,
          nicheConfidence: nicheMapping.confidence,
          processedAt: new Date().toISOString(),
          extractResultsCount: extractResults.results?.length || 0,
          researchResultsCount: researchResults.results?.length || 0,
        },
      };
    } catch (error) {
      console.error(`Intake Service Error: ${error.message}`);

      // Check for rate limit or API errors
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429')
      ) {
        throw this._createError(503, `Rate limit exceeded: ${error.message}`);
      }

      if (
        error.message.includes('API error') ||
        error.message.includes('401')
      ) {
        throw this._createError(
          503,
          `API authentication failed: ${error.message}`,
        );
      }

      throw this._createError(
        503,
        `Intake processing failed: ${error.message}`,
      );
    }
  }

  /**
   * Analyze business "Soul" using Gemini API
   * @param {string} url - Business URL
   * @param {string} businessDescription - Business description
   * @returns {Promise<Object>} Niche mapping with confidence
   * @private
   */
  async _analyzeBusinessSoul(url, businessDescription) {
    try {
      if (!this.geminiApiKey) {
        // Fallback to keyword-based matching if Gemini API key not available
        console.warn(
          'Gemini API not available, using keyword-based niche matching',
        );
        return this._keywordBasedNicheMatching(url, businessDescription);
      }

      const supportedNiches = this.nichesConfig._meta?.supported_niches || [
        'medical',
        'legal',
        'home-services',
        'restaurant',
      ];
      const prompt = this._buildGeminiPrompt(
        url,
        businessDescription,
        supportedNiches,
      );

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Gemini API error: ${data.error?.message || response.statusText}`,
        );
      }

      const geminiResponse =
        data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this._parseGeminiResponse(geminiResponse, supportedNiches);
    } catch (error) {
      console.error(
        `Gemini analysis failed: ${error.message}, falling back to keyword matching`,
      );
      return this._keywordBasedNicheMatching(url, businessDescription);
    }
  }

  /**
   * Build prompt for Gemini API
   * @param {string} url - Business URL
   * @param {string} businessDescription - Business description
   * @param {Array<string>} supportedNiches - Supported niches
   * @returns {string} Formatted prompt
   * @private
   */
  _buildGeminiPrompt(url, businessDescription, supportedNiches) {
    return `Analyze this business and map it to one of these niches: ${supportedNiches.join(', ')}.

Business URL: ${url}
Business Description: ${businessDescription}

Please analyze the business "soul" - its core purpose, target audience, and industry characteristics. Then:
1. Select the most appropriate niche from the list
2. Provide a confidence score (0-100)
3. Explain your reasoning in 2-3 sentences

Respond in this exact JSON format:
{
  "niche": "selected_niche",
  "confidence": 85,
  "reasoning": "brief explanation"
}`;
  }

  /**
   * Parse Gemini API response
   * @param {string} response - Gemini response text
   * @param {Array<string>} supportedNiches - Supported niches
   * @returns {Object} Parsed niche mapping
   * @private
   */
  _parseGeminiResponse(response, supportedNiches) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const niche = parsed.niche?.toLowerCase();

        if (supportedNiches.includes(niche)) {
          return {
            niche,
            confidence: parsed.confidence || 70,
            reasoning: parsed.reasoning || '',
            method: 'gemini_api',
          };
        }
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error.message);
    }

    // Fallback to default if parsing fails
    return {
      niche: this.nichesConfig._meta?.default_niche || 'medical',
      confidence: 50,
      reasoning: 'Failed to parse Gemini response, using default niche',
      method: 'gemini_fallback',
    };
  }

  /**
   * Keyword-based niche matching (fallback)
   * @param {string} url - Business URL
   * @param {string} businessDescription - Business description
   * @returns {Object} Niche mapping
   * @private
   */
  _keywordBasedNicheMatching(url, businessDescription) {
    const combinedText = `${url} ${businessDescription}`.toLowerCase();
    const keywords = this.nichesConfig.keywords || {};
    const supportedNiches = this.nichesConfig._meta?.supported_niches || [
      'medical',
      'legal',
      'home-services',
      'restaurant',
    ];

    let bestMatch = this.nichesConfig._meta?.default_niche || 'medical';
    let highestScore = 0;

    for (const niche of supportedNiches) {
      const nicheKeywords = keywords[niche] || [];
      let score = 0;

      for (const keyword of nicheKeywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          score++;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = niche;
      }
    }

    return {
      niche: bestMatch,
      confidence: Math.min(50 + highestScore * 10, 90),
      reasoning: `Keyword-based matching found ${highestScore} matching keywords`,
      method: 'keyword_matching',
    };
  }

  /**
   * Build research query from URL and business description
   * @param {string} url - Target URL
   * @param {string} businessDescription - Business description
   * @returns {string} Formatted research query
   * @private
   */
  _buildResearchQuery(url, businessDescription) {
    const domain = new URL(url).hostname;
    return `${businessDescription} site:${domain} business analysis`;
  }

  /**
   * Format combined results for downstream processing
   * @param {Object} extractResults - URL extraction results
   * @param {Object} researchResults - Research results
   * @param {string} url - Original URL
   * @param {string} businessDescription - Business description
   * @param {Object} nicheMapping - Niche mapping from Gemini
   * @returns {Object} Formatted results
   * @private
   */
  _formatResults(
    extractResults,
    researchResults,
    url,
    businessDescription,
    nicheMapping,
  ) {
    return {
      source: {
        url,
        businessDescription,
        domain: new URL(url).hostname,
      },
      niche: {
        selected: nicheMapping.niche,
        confidence: nicheMapping.confidence,
        reasoning: nicheMapping.reasoning,
        method: nicheMapping.method,
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
      summary: this._generateSummary(
        extractResults,
        researchResults,
        businessDescription,
        nicheMapping,
      ),
    };
  }

  /**
   * Generate summary of findings
   * @param {Object} extractResults - Extraction results
   * @param {Object} researchResults - Research results
   * @param {string} businessDescription - Business description
   * @param {Object} nicheMapping - Niche mapping
   * @returns {string} Summary text
   * @private
   */
  _generateSummary(
    extractResults,
    researchResults,
    businessDescription,
    nicheMapping,
  ) {
    const title = extractResults.results?.[0]?.title || 'Unknown';
    const answer = researchResults.answer || 'No direct answer available';

    return `Analysis of ${title} (${nicheMapping.niche} niche, ${nicheMapping.confidence}% confidence). Business: ${businessDescription}. Key findings: ${answer.substring(0, 500)}...`;
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
    error.service = 'intake_service';
    return error;
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
      console.error(
        'Intake Service configuration validation failed:',
        error.message,
      );
      return false;
    }
  }
}

module.exports = IntakeService;
