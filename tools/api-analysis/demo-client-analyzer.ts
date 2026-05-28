/**
 * Demo script for client-analyzer.ts
 * Feature: api-routes-complete-analysis
 * 
 * This script demonstrates how to use the client analyzer to validate
 * the Axios client configuration against requirements 8.1-8.5 and 12.1-12.6
 */

import * as path from 'path';
import { analyzeClient, generateClientReport } from './src/analyzers/client-analyzer';

// Path to the client.ts file
const clientFilePath = path.resolve(__dirname, '../../src/services/api/client.ts');

console.log('🔍 Analyzing Axios Client Configuration');
console.log('='.repeat(80));
console.log(`File: ${clientFilePath}\n`);

try {
  // Analyze the client file
  const result = analyzeClient(clientFilePath);

  // Display summary
  console.log('📊 Analysis Summary:');
  console.log(`   X-API-Key Interceptor: ${result.summary.hasXApiKeyInterceptor ? '✅' : '❌'}`);
  console.log(`   Authorization Interceptor: ${result.summary.hasAuthorizationInterceptor ? '✅' : '❌'}`);
  console.log(`   401 Error Handler: ${result.summary.has401ErrorHandler ? '✅' : '❌'}`);
  console.log(`   Token Refresh: ${result.summary.hasTokenRefresh ? '✅' : '❌'}`);
  console.log(`   Base URL Configuration: ${result.summary.hasBaseURL ? '✅' : '❌'}`);
  console.log(`   Handled Error Codes: ${result.summary.handledErrorCodes.join(', ')}`);
  
  if (result.summary.missingErrorCodes.length > 0) {
    console.log(`   Missing Error Codes: ${result.summary.missingErrorCodes.join(', ')}`);
  }

  // Display issues
  console.log(`\n📋 Issues Found: ${result.issues.length}`);
  
  if (result.issues.length > 0) {
    const criticalIssues = result.issues.filter(i => i.severity === 'CRITICAL');
    const highIssues = result.issues.filter(i => i.severity === 'HIGH');
    const mediumIssues = result.issues.filter(i => i.severity === 'MEDIUM');
    const lowIssues = result.issues.filter(i => i.severity === 'LOW');

    if (criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues (${criticalIssues.length}):`);
      criticalIssues.forEach((issue, index) => {
        console.log(`\n   ${index + 1}. ${issue.description}`);
        console.log(`      Component: ${issue.component}`);
        console.log(`      Requirement: ${issue.requirement}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
      });
    }

    if (highIssues.length > 0) {
      console.log(`\n⚠️  High Priority Issues (${highIssues.length}):`);
      highIssues.forEach((issue, index) => {
        console.log(`\n   ${index + 1}. ${issue.description}`);
        console.log(`      Component: ${issue.component}`);
        console.log(`      Requirement: ${issue.requirement}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
      });
    }

    if (mediumIssues.length > 0) {
      console.log(`\n📝 Medium Priority Issues (${mediumIssues.length}):`);
      mediumIssues.forEach((issue, index) => {
        console.log(`\n   ${index + 1}. ${issue.description}`);
        console.log(`      Component: ${issue.component}`);
        console.log(`      Requirement: ${issue.requirement}`);
      });
    }

    if (lowIssues.length > 0) {
      console.log(`\n💡 Low Priority Issues (${lowIssues.length}):`);
      lowIssues.forEach((issue, index) => {
        console.log(`\n   ${index + 1}. ${issue.description}`);
      });
    }
  } else {
    console.log('\n✅ No issues found! The client configuration meets all requirements.');
  }

  // Generate and display full report
  console.log('\n' + '='.repeat(80));
  console.log('📄 Full Report:');
  console.log('='.repeat(80));
  console.log(generateClientReport(result));

  console.log('='.repeat(80));
  console.log('✅ Client analysis complete!');
  console.log('='.repeat(80));

  // Exit with appropriate code
  process.exit(result.issues.length > 0 ? 1 : 0);

} catch (error) {
  console.error('\n❌ Error analyzing client file:');
  console.error(error);
  process.exit(1);
}
