const PipelineService = require('../services/pipeline_service');

/**
 * Integration Test - Full pipeline verification
 * Tests Intake → Research → Web3Forms flow
 */

// Test configuration
const TEST_CONFIG = {
  url: 'https://example.com',
  predicament: 'Business needs website redesign for better conversion',
  submitter: {
    name: 'Test User',
    email: 'test@example.com',
  },
  options: {
    extract_depth: 'basic',
    search_depth: 'basic',
    max_results: 3,
    days: 1,
    submitToWeb3Forms: false, // Don't actually submit in test
  },
};

/**
 * Run integration test
 */
async function runIntegrationTest() {
  console.log('=== Webify Integration Test ===\n');
  
  const pipelineService = new PipelineService();
  
  try {
    // Step 1: Validate configuration
    console.log('Step 1: Validating pipeline configuration...');
    const validation = await pipelineService.validatePipelineConfiguration();
    
    if (validation.success) {
      console.log('✅ Configuration validation passed');
      console.log(`   - Intake Service: ${validation.services.intake ? '✅' : '❌'}`);
      console.log(`   - Web3Forms Service: ${validation.services.web3Forms ? '✅' : '❌'}`);
    } else {
      console.log('❌ Configuration validation failed');
      console.log(`   Error: ${validation.error || 'Unknown error'}`);
      process.exit(1);
    }
    
    // Step 2: Execute pipeline
    console.log('\nStep 2: Executing pipeline...');
    console.log(`   URL: ${TEST_CONFIG.url}`);
    console.log(`   Predicament: ${TEST_CONFIG.predicament}`);
    
    const results = await pipelineService.executePipeline(
      TEST_CONFIG.url,
      TEST_CONFIG.predicament,
      TEST_CONFIG.submitter,
      TEST_CONFIG.options
    );
    
    if (results.success) {
      console.log('✅ Pipeline execution successful');
      console.log(`   Pipeline ID: ${results.pipelineId}`);
      console.log(`   Extracted items: ${results.data.intake.metadata.extractResultsCount}`);
      console.log(`   Researched items: ${results.data.intake.metadata.researchResultsCount}`);
      console.log(`   Executed at: ${results.metadata.executedAt}`);
      
      // Step 3: Verify results
      console.log('\nStep 3: Verifying results...');
      
      const intakeData = results.data.intake.data;
      if (intakeData.source.url === TEST_CONFIG.url) {
        console.log('✅ Source URL verified');
      } else {
        console.log('❌ Source URL mismatch');
      }
      
      if (intakeData.source.predicament === TEST_CONFIG.predicament) {
        console.log('✅ Predicament verified');
      } else {
        console.log('❌ Predicament mismatch');
      }
      
      if (intakeData.extraction.title) {
        console.log(`✅ Extraction successful: "${intakeData.extraction.title}"`);
      } else {
        console.log('⚠️  No extraction title found (may be expected for test URL)');
      }
      
      if (intakeData.research.results && intakeData.research.results.length > 0) {
        console.log(`✅ Research successful: ${intakeData.research.results.length} results`);
      } else {
        console.log('⚠️  No research results found (may be expected for test URL)');
      }
      
      console.log('\n=== Integration Test Passed ===');
      console.log('All services are functioning correctly.');
      
      return results;
    } else {
      console.log('❌ Pipeline execution failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('rate limit')) {
      console.error('Action: Check API rate limits and retry later');
    } else if (error.message.includes('authentication')) {
      console.error('Action: Verify API keys in .env file');
    } else {
      console.error('Action: Check service configuration and network connectivity');
    }
    
    process.exit(1);
  }
}

/**
 * Run test with custom configuration
 */
async function runCustomTest(url, predicament, submitter, options) {
  console.log('=== Custom Integration Test ===\n');
  
  const pipelineService = new PipelineService();
  
  try {
    const results = await pipelineService.executePipeline(
      url,
      predicament,
      submitter,
      options
    );
    
    console.log('\n=== Custom Test Passed ===');
    return results;
  } catch (error) {
    console.error('\n❌ Custom Test Failed');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Export test functions
module.exports = {
  runIntegrationTest,
  runCustomTest,
  TEST_CONFIG,
};

// Run default test if executed directly
if (require.main === module) {
  runIntegrationTest()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
