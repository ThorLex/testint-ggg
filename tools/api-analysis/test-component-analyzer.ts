/**
 * Test script for component analyzer
 * 
 * This script tests the component analyzer on the actual component files
 * to verify it correctly identifies deprecated hooks and obsolete properties.
 */

import { analyzeComponents } from './src/analyzers/component-analyzer';
import * as path from 'path';

// Component files to analyze
const componentFiles = [
  path.resolve(__dirname, '../../src/components/organisms/AmodiataireDetailsPage.tsx'),
  path.resolve(__dirname, '../../src/components/molecules/MediaGallery.tsx'),
];

console.log('🔍 Testing Component Analyzer\n');
console.log('=' .repeat(80));
console.log('Analyzing components for deprecated hooks and obsolete properties...\n');

try {
  const result = analyzeComponents(componentFiles);
  
  console.log('📊 Analysis Results:');
  console.log('-'.repeat(80));
  console.log(`Total components analyzed: ${result.statistics.totalComponents}`);
  console.log(`Components with issues: ${result.statistics.componentsWithIssues}`);
  console.log(`Deprecated hooks found: ${result.statistics.deprecatedHooksFound}`);
  console.log(`Obsolete properties found: ${result.statistics.obsoletePropertiesFound}`);
  console.log(`Total issues: ${result.issues.length}\n`);
  
  if (result.issues.length > 0) {
    console.log('🔴 Issues Found:');
    console.log('-'.repeat(80));
    
    result.issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.type}] ${issue.component}`);
      console.log(`   File: ${issue.file}`);
      console.log(`   Location: Line ${issue.line}, Column ${issue.column}`);
      
      if (issue.hookName) {
        console.log(`   Hook: ${issue.hookName}`);
      }
      
      if (issue.propertyPath) {
        console.log(`   Property: ${issue.propertyPath}`);
      }
      
      if (issue.suggestion) {
        console.log(`   💡 Suggestion: ${issue.suggestion}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Component analyzer test completed successfully!');
    console.log('Found issues that need to be addressed in the components.');
  } else {
    console.log('✅ No issues found! All components are using current APIs.');
  }
  
} catch (error) {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
}
