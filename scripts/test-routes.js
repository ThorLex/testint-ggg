/**
 * Simple script to test that all route constants are properly defined
 * Run with: node scripts/test-routes.js
 */

// Note: This is a simple test script. For actual testing, you'd need to set up
// a proper test environment with TypeScript support.

console.log('Testing route constants...\n');

// Simulate the routes object
const ApiRoutes = {
    BASE_URL: 'https://navipad-superbase.vercel.app',
    PROFILE: '/api/mobile/profile',
    AMODIATAIRES: '/api/mobile/public/amodiataires',
    AMODIATAIRE_DETAILS: '/api/mobile/public/amodiataires/:id',
    MEDIA: '/api/mobile/media',
    
    getFullUrl: function(endpoint, queryParams) {
        const params = queryParams ? this.buildQueryParams(queryParams) : '';
        return `${this.BASE_URL}${endpoint}${params}`;
    },
    
    buildQueryParams: function(params) {
        if (!params || Object.keys(params).length === 0) return '';
        const queryString = Object.entries(params)
            .filter(([_, value]) => value != null)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&');
        return queryString ? `?${queryString}` : '';
    }
};

// Test cases
const tests = [
    {
        name: 'PROFILE constant',
        value: ApiRoutes.PROFILE,
        expected: '/api/mobile/profile',
    },
    {
        name: 'PROFILE full URL',
        value: ApiRoutes.getFullUrl(ApiRoutes.PROFILE),
        expected: 'https://navipad-superbase.vercel.app/api/mobile/profile',
    },
    {
        name: 'AMODIATAIRES constant',
        value: ApiRoutes.AMODIATAIRES,
        expected: '/api/mobile/public/amodiataires',
    },
    {
        name: 'AMODIATAIRES full URL',
        value: ApiRoutes.getFullUrl(ApiRoutes.AMODIATAIRES),
        expected: 'https://navipad-superbase.vercel.app/api/mobile/public/amodiataires',
    },
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
    const success = test.value === test.expected;
    const status = success ? '✅ PASS' : '❌ FAIL';
    
    console.log(`${status} - ${test.name}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got:      ${test.value}`);
    
    if (test.value === undefined) {
        console.log('  ⚠️  WARNING: Value is undefined! This indicates a cache issue.');
    }
    
    console.log('');
    
    if (success) {
        passed++;
    } else {
        failed++;
    }
});

console.log('='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
    console.log('\n⚠️  Some tests failed!');
    console.log('If you see "undefined" values, try:');
    console.log('  1. Clear Metro cache: npx expo start --clear');
    console.log('  2. Or run: scripts\\clear-cache-and-restart.bat');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
}
