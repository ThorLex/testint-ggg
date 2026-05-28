/**
 * Demo script for client-parser.ts
 * Feature: api-routes-complete-analysis
 * 
 * This script demonstrates how to use the client parser to extract
 * Axios configuration, interceptors, and error handlers from client.ts
 */

import * as path from 'path';
import {
  parseClientFile,
  toClientConfiguration,
  findErrorHandler,
  hasRequestHeader,
  getHandledErrorCodes,
} from './src/parsers/client-parser';

// Path to the client.ts file
const clientFilePath = path.resolve(__dirname, '../../src/services/api/client.ts');

console.log('🔍 Parsing Axios Client Configuration');
console.log('=' .repeat(80));
console.log(`File: ${clientFilePath}\n`);

try {
  // Parse the client file
  const parsed = parseClientFile(clientFilePath);

  // Display configuration
  console.log('📋 Axios Configuration:');
  console.log(`   Base URL: ${parsed.config.baseURL}`);
  console.log(`   Timeout: ${parsed.config.timeout}ms`);
  console.log(`   Headers:`);
  if (parsed.config.headers) {
    Object.entries(parsed.config.headers).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value}`);
    });
  }

  // Display request interceptors
  console.log('\n🔐 Request Interceptors:');
  parsed.requestInterceptors.forEach((interceptor, index) => {
    console.log(`\n   ${index + 1}. ${interceptor.description}`);
    console.log(`      Headers added: ${interceptor.addsHeaders.join(', ')}`);
    console.log(`      Uses AsyncStorage: ${interceptor.usesAsyncStorage ? '✓' : '✗'}`);
    console.log(`      Logs requests: ${interceptor.logsRequests ? '✓' : '✗'}`);
  });

  // Display response interceptors
  console.log('\n📥 Response Interceptors:');
  parsed.responseInterceptors.forEach((interceptor, index) => {
    console.log(`\n   ${index + 1}. ${interceptor.description}`);
    console.log(`      Logs responses: ${interceptor.logsResponses ? '✓' : '✗'}`);
    console.log(`      Handles errors: ${interceptor.handlesErrors ? '✓' : '✗'}`);
  });

  // Display error handlers
  console.log('\n❌ Error Handlers:');
  const errorCodes = getHandledErrorCodes(parsed.errorHandlers);
  console.log(`   Handled status codes: ${errorCodes.join(', ')}\n`);
  
  parsed.errorHandlers.forEach((handler) => {
    console.log(`   ${handler.statusCode} - ${handler.errorCode}`);
    console.log(`      Description: ${handler.description}`);
    if (handler.attemptsTokenRefresh) {
      console.log(`      ⚡ Attempts token refresh`);
    }
    if (handler.clearsStorage) {
      console.log(`      🗑️  Clears storage`);
    }
    console.log(`      Returns formatted error: ${handler.returnsFormattedError ? '✓' : '✗'}`);
    console.log('');
  });

  // Display utility functions
  console.log('🛠️  Utility Functions:');
  console.log(`   ${parsed.utilityFunctions.join(', ')}`);

  // Validation checks
  console.log('\n✅ Validation Checks:');
  console.log(`   X-API-Key header: ${hasRequestHeader(parsed.requestInterceptors, 'x-api-key') ? '✓' : '✗'}`);
  console.log(`   Authorization header: ${hasRequestHeader(parsed.requestInterceptors, 'Authorization') ? '✓' : '✗'}`);
  
  const handler401 = findErrorHandler(parsed.errorHandlers, 401);
  console.log(`   401 handler exists: ${handler401 ? '✓' : '✗'}`);
  if (handler401) {
    console.log(`   401 attempts token refresh: ${handler401.attemptsTokenRefresh ? '✓' : '✗'}`);
  }
  
  const handler400 = findErrorHandler(parsed.errorHandlers, 400);
  console.log(`   400 handler exists: ${handler400 ? '✓' : '✗'}`);
  
  const handler404 = findErrorHandler(parsed.errorHandlers, 404);
  console.log(`   404 handler exists: ${handler404 ? '✓' : '✗'}`);
  
  const handler500 = findErrorHandler(parsed.errorHandlers, 500);
  console.log(`   500 handler exists: ${handler500 ? '✓' : '✗'}`);

  // Convert to ClientConfiguration format
  console.log('\n🔄 Converting to ClientConfiguration format...');
  const config = toClientConfiguration(parsed);
  console.log(`   Request interceptors: ${config.interceptors.request.length}`);
  console.log(`   Response interceptors: ${config.interceptors.response.length}`);
  console.log(`   Error handlers: ${config.errorHandlers.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Client parsing complete!');
  console.log('='.repeat(80));

} catch (error) {
  console.error('\n❌ Error parsing client file:');
  console.error(error);
  process.exit(1);
}
