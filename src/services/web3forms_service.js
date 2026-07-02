require('dotenv').config();

/**
 * Web3Forms Service - Handles form submissions via Web3Forms API
 * Captures "Consultant AI" output and sends to configured endpoint
 */
class Web3FormsService {
  constructor() {
    this.accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    this.endpoint = 'https://api.web3forms.com/submit';

    if (!this.accessKey) {
      throw new Error(
        'WEB3FORMS_ACCESS_KEY not found in environment variables',
      );
    }
  }

  /**
   * Submit form data to Web3Forms
   * @param {Object} formData - Form data to submit
   * @param {string} formData.name - Submitter name
   * @param {string} formData.email - Submitter email
   * @param {string} formData.message - Form message/content
   * @param {Object} options - Additional submission options
   * @returns {Promise<Object>} Submission response
   */
  async submit(formData, options = {}) {
    try {
      // Validate required fields
      if (!formData.name) {
        throw new Error('Name is required for form submission');
      }
      if (!formData.email) {
        throw new Error('Email is required for form submission');
      }
      if (!formData.message) {
        throw new Error('Message is required for form submission');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Invalid email format');
      }

      // Prepare submission payload
      const payload = {
        access_key: this.accessKey,
        subject: options.subject || 'Webify Consultant AI Analysis',
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        reply_to: options.reply_to || formData.email,
        ...options.customFields,
      };

      // Add Consultant AI specific metadata
      if (options.consultantOutput) {
        payload.consultant_output = JSON.stringify(options.consultantOutput);
      }

      // Make API request
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          `Web3Forms API error: ${data.message || response.statusText}`,
        );
      }

      return {
        success: true,
        data,
        metadata: {
          submittedAt: new Date().toISOString(),
          recipient: options.reply_to || formData.email,
        },
      };
    } catch (error) {
      console.error(`Web3Forms Service Error: ${error.message}`);

      // Check for rate limit or API errors
      if (
        error.message.includes('rate limit') ||
        error.message.includes('429')
      ) {
        throw new Error(`Rate limit exceeded: ${error.message}`);
      }

      if (
        error.message.includes('API error') ||
        error.message.includes('401')
      ) {
        throw new Error(`API authentication failed: ${error.message}`);
      }

      throw error;
    }
  }

  /**
   * Submit Consultant AI analysis results
   * @param {Object} analysis - Analysis results from pipeline
   * @param {Object} submitter - Submitter information
   * @returns {Promise<Object>} Submission response
   */
  async submitConsultantAnalysis(analysis, submitter) {
    try {
      // Format analysis for submission
      const message = this._formatAnalysisMessage(analysis);

      const formData = {
        name: submitter.name || 'Webify User',
        email:
          submitter.email || process.env.DEFAULT_EMAIL || 'user@example.com',
        message,
      };

      const options = {
        subject: `Webify Analysis: ${analysis.metadata?.url || 'Unknown URL'}`,
        consultantOutput: analysis,
        customFields: {
          source_url: analysis.metadata?.url || '',
          predicament: analysis.metadata?.predicament || '',
          analysis_type: 'consultant_ai',
        },
      };

      return await this.submit(formData, options);
    } catch (error) {
      console.error('Consultant AI submission failed:', error.message);
      throw error;
    }
  }

  /**
   * Format analysis results for message
   * @param {Object} analysis - Analysis results
   * @returns {string} Formatted message
   * @private
   */
  _formatAnalysisMessage(analysis) {
    const { source, extraction, research, summary } = analysis.data;

    let message = `Webify Consultant AI Analysis\n`;
    message += `============================\n\n`;
    message += `Source: ${source.url}\n`;
    message += `Predicament: ${source.predicament}\n\n`;

    if (extraction.title) {
      message += `Page Title: ${extraction.title}\n\n`;
    }

    if (summary) {
      message += `Summary:\n${summary}\n\n`;
    }

    if (research.answer) {
      message += `Research Findings:\n${research.answer}\n\n`;
    }

    message += `Generated at: ${analysis.metadata?.processedAt || new Date().toISOString()}\n`;

    return message;
  }

  /**
   * Validate Web3Forms configuration
   * @returns {Promise<boolean>} Validation status
   */
  async validateConfiguration() {
    try {
      // Test with minimal form data
      const testPayload = {
        access_key: this.accessKey,
        subject: 'Configuration Test',
        from_name: 'Webify System',
        from_email: 'test@example.com',
        message: 'Configuration validation test',
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });

      return response.ok;
    } catch (error) {
      console.error(
        'Web3Forms configuration validation failed:',
        error.message,
      );
      return false;
    }
  }
}

module.exports = Web3FormsService;
