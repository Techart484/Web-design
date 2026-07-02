const IntakeService = require('./intake_service');
const Web3FormsService = require('./web3forms_service');

/**
 * Pipeline Service - Orchestrates the complete Intake → Research → Web3Forms flow
 * Handles end-to-end processing from user input to form submission
 */
class PipelineService {
  constructor() {
    this.intakeService = new IntakeService();
    this.web3FormsService = new Web3FormsService();
  }

  /**
   * Execute complete pipeline: Intake → Research → Web3Forms
   * @param {string} url - Target URL to analyze
   * @param {string} businessDescription - User's business description
   * @param {Object} submitter - Submitter information for Web3Forms
   * @param {Object} options - Pipeline options
   * @returns {Promise<Object>} Complete pipeline results
   */
  async executePipeline(url, businessDescription, submitter, options = {}) {
    const pipelineId = this._generatePipelineId();
    const startTime = Date.now();
    console.log(`Starting pipeline ${pipelineId} for URL: ${url}`);

    try {
      // Step 1: Process intake (URL + business description) with Gemini niche mapping
      console.log(
        `[${pipelineId}] Step 1: Processing intake with Gemini analysis...`,
      );
      const intakeResults = await this.intakeService.processIntake(
        url,
        businessDescription,
        {
          extract_depth: options.extract_depth || 'advanced',
          search_depth: options.search_depth || 'advanced',
          max_results: options.max_results || 10,
          days: options.days || 7,
        },
      );

      if (!intakeResults.success) {
        throw this._createError(503, 'Intake processing failed');
      }

      console.log(
        `[${pipelineId}] Step 1 completed: Niche=${intakeResults.metadata.niche}, Extracted ${intakeResults.metadata.extractResultsCount} items, researched ${intakeResults.metadata.researchResultsCount} items`,
      );

      // Step 2: Submit Consultant AI analysis to Web3Forms (if submitter info provided)
      // This is the Consultant AI module acting as a child of the main pipeline
      let web3FormsResults = null;
      if (submitter && options.submitToWeb3Forms !== false) {
        console.log(
          `[${pipelineId}] Step 2: Submitting Consultant AI analysis to Web3Forms...`,
        );
        web3FormsResults = await this.web3FormsService.submitConsultantAnalysis(
          intakeResults,
          submitter,
        );

        if (!web3FormsResults.success) {
          console.warn(
            `[${pipelineId}] Web3Forms submission failed, but pipeline continues`,
          );
        } else {
          console.log(
            `[${pipelineId}] Step 2 completed: Consultant AI form submitted successfully`,
          );
        }
      }

      // Step 3: Return complete pipeline results
      const duration = Date.now() - startTime;
      const pipelineResults = {
        success: true,
        pipelineId,
        data: {
          intake: intakeResults,
          consultantAI: web3FormsResults, // Consultant AI as child module
        },
        metadata: {
          url,
          businessDescription,
          niche: intakeResults.metadata.niche,
          nicheConfidence: intakeResults.metadata.nicheConfidence,
          submitter: submitter
            ? {
                name: submitter.name,
                email: submitter.email,
              }
            : null,
          executedAt: new Date().toISOString(),
          duration: `${duration}ms`,
        },
      };

      console.log(
        `[${pipelineId}] Pipeline completed successfully in ${duration}ms`,
      );
      return pipelineResults;
    } catch (error) {
      console.error(`[${pipelineId}] Pipeline failed: ${error.message}`);

      // Check for rate limit or API errors
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429')
      ) {
        throw this._createError(
          503,
          `Pipeline halted - Rate limit exceeded: ${error.message}`,
        );
      }

      if (
        error.message.includes('API error') ||
        error.message.includes('401')
      ) {
        throw this._createError(
          503,
          `Pipeline halted - API authentication failed: ${error.message}`,
        );
      }

      throw this._createError(
        503,
        `Pipeline execution failed: ${error.message}`,
      );
    }
  }

  /**
   * Execute pipeline with automatic error handling and retry
   * @param {string} url - Target URL
   * @param {string} predicament - User predicament
   * @param {Object} submitter - Submitter info
   * @param {Object} options - Pipeline options including retry settings
   * @returns {Promise<Object>} Pipeline results
   */
  async executePipelineWithRetry(url, predicament, submitter, options = {}) {
    const maxRetries = options.maxRetries || 2;
    const retryDelay = options.retryDelay || 1000; // milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Pipeline attempt ${attempt}/${maxRetries}`);
        return await this.executePipeline(url, predicament, submitter, options);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error; // Final attempt failed
        }

        console.warn(
          `Attempt ${attempt} failed, retrying in ${retryDelay}ms...`,
        );
        await this._sleep(retryDelay);
      }
    }
  }

  /**
   * Validate all pipeline service configurations
   * @returns {Promise<Object>} Validation results
   */
  async validatePipelineConfiguration() {
    try {
      const intakeValid = await this.intakeService.validateConfiguration();
      const web3FormsValid =
        await this.web3FormsService.validateConfiguration();

      return {
        success: intakeValid && web3FormsValid,
        services: {
          intake: intakeValid,
          web3Forms: web3FormsValid,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Pipeline configuration validation failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate unique pipeline ID
   * @returns {string} Pipeline ID
   * @private
   */
  _generatePipelineId() {
    return `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate pipeline duration
   * @returns {string} Duration string
   * @private
   */
  _calculateDuration() {
    // Simplified duration calculation
    // In production, track start time and calculate actual duration
    return '< 1s';
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    error.service = 'pipeline_service';
    return error;
  }
}

module.exports = PipelineService;
