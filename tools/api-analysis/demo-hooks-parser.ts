/**
 * Demo script to showcase the hooks parser
 * Feature: api-routes-complete-analysis
 */

import { parseApiHooks } from './src/parsers/hooks-parser';
import * as path from 'path';

const useApiPath = path.resolve(__dirname, '../../src/hooks/useApi.ts');

console.log('🔍 Parsing React Query hooks from useApi.ts...\n');

const hooks = parseApiHooks(useApiPath);

console.log(`✅ Found ${hooks.length} hooks\n`);

// Display summary
console.log('📊 Hook Summary:');
console.log('================\n');

const queryHooks = hooks.filter(h => h.type === 'query');
const mutationHooks = hooks.filter(h => h.type === 'mutation');

console.log(`Query Hooks: ${queryHooks.length}`);
console.log(`Mutation Hooks: ${mutationHooks.length}\n`);

// Display detailed information for a few hooks
console.log('📝 Sample Hook Details:');
console.log('=======================\n');

// Example 1: Query hook
const useAmodiataires = hooks.find(h => h.name === 'useAmodiataires');
if (useAmodiataires) {
  console.log('1. useAmodiataires (Query Hook)');
  console.log(`   Type: ${useAmodiataires.type}`);
  console.log(`   Endpoint: ${useAmodiataires.endpoint}`);
  console.log(`   Query Key: [${useAmodiataires.queryKey?.join(', ')}]`);
  console.log(`   Parameters: ${useAmodiataires.parameters?.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ') || 'none'}`);
  console.log();
}

// Example 2: Mutation hook with cache invalidation
const useUpdateProfile = hooks.find(h => h.name === 'useUpdateProfile');
if (useUpdateProfile) {
  console.log('2. useUpdateProfile (Mutation Hook)');
  console.log(`   Type: ${useUpdateProfile.type}`);
  console.log(`   Endpoint: ${useUpdateProfile.endpoint}`);
  console.log(`   Parameters: ${useUpdateProfile.parameters?.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ') || 'none'}`);
  console.log(`   Invalidates Cache:`);
  if (useUpdateProfile.invalidatesCache) {
    useUpdateProfile.invalidatesCache.forEach(key => {
      console.log(`     - [${key.join(', ')}]`);
    });
  }
  console.log();
}

// Example 3: Hook with utility method URL
const useAmodiataireDetail = hooks.find(h => h.name === 'useAmodiataireDetail');
if (useAmodiataireDetail) {
  console.log('3. useAmodiataireDetail (Query Hook with Utility Method)');
  console.log(`   Type: ${useAmodiataireDetail.type}`);
  console.log(`   Endpoint: ${useAmodiataireDetail.endpoint}`);
  console.log(`   Query Key: [${useAmodiataireDetail.queryKey?.join(', ')}]`);
  console.log(`   Parameters: ${useAmodiataireDetail.parameters?.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ') || 'none'}`);
  console.log();
}

// Example 4: Mutation with multiple cache invalidations
const useSubmitMediaValidation = hooks.find(h => h.name === 'useSubmitMediaValidation');
if (useSubmitMediaValidation) {
  console.log('4. useSubmitMediaValidation (Mutation with Multiple Invalidations)');
  console.log(`   Type: ${useSubmitMediaValidation.type}`);
  console.log(`   Endpoint: ${useSubmitMediaValidation.endpoint}`);
  console.log(`   Invalidates Cache:`);
  if (useSubmitMediaValidation.invalidatesCache) {
    useSubmitMediaValidation.invalidatesCache.forEach(key => {
      console.log(`     - [${key.join(', ')}]`);
    });
  }
  console.log();
}

// List all hooks by category
console.log('📋 All Hooks by Category:');
console.log('=========================\n');

console.log('Query Hooks:');
queryHooks.forEach(h => {
  console.log(`  - ${h.name} → ${h.endpoint}`);
});

console.log('\nMutation Hooks:');
mutationHooks.forEach(h => {
  const invalidations = h.invalidatesCache ? ` (invalidates ${h.invalidatesCache.length} cache${h.invalidatesCache.length > 1 ? 's' : ''})` : '';
  console.log(`  - ${h.name} → ${h.endpoint}${invalidations}`);
});

console.log('\n✨ Parser demonstration complete!');
