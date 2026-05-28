/**
 * Property-based tests for API Routes Configuration
 * 
 * Tests universal properties of URL construction and query parameter handling.
 * 
 * Feature: api-routes-refactoring
 */

import * as fc from 'fast-check';
import { ApiRoutes } from '../routes';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid endpoint paths
 * Generates paths that start with / and contain alphanumeric characters, hyphens, and slashes
 */
const endpointArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => s.length > 0)
    .map(s => {
        // Ensure it starts with /
        const path = s.startsWith('/') ? s : `/${s}`;
        // Replace invalid characters with valid ones
        return path.replace(/[^a-zA-Z0-9\-_/:]/g, '-');
    });

/**
 * Generator for query parameter values
 * Generates strings, numbers, and booleans
 */
const queryParamValueArbitrary = fc.oneof(
    fc.string({ maxLength: 50 }),
    fc.integer(),
    fc.boolean(),
    fc.float({ noNaN: true, noDefaultInfinity: true })
);

/**
 * Generator for valid query parameter keys
 * Generates keys that are valid for URL query parameters (alphanumeric, underscore, hyphen)
 */
const queryParamKeyArbitrary = fc.string({ minLength: 1, maxLength: 20 })
    .filter(s => s.length > 0)
    .map(s => s.replace(/[^a-zA-Z0-9_-]/g, 'a'))
    .filter(s => s.length > 0);

/**
 * Generator for query parameter objects
 * Generates objects with string keys and mixed value types
 */
const queryParamsArbitrary = fc.dictionary(
    queryParamKeyArbitrary,
    queryParamValueArbitrary,
    { maxKeys: 10 }
);

/**
 * Generator for query parameters that may include null/undefined values
 */
const queryParamsWithNullsArbitrary = fc.dictionary(
    queryParamKeyArbitrary,
    fc.oneof(
        queryParamValueArbitrary,
        fc.constant(null),
        fc.constant(undefined)
    ),
    { maxKeys: 10 }
);

/**
 * Generator for strings with special characters that need URL encoding
 */
const specialCharStringArbitrary = fc.oneof(
    fc.constant('hello world'),
    fc.constant('test&value'),
    fc.constant('key=value'),
    fc.constant('test?query'),
    fc.constant('path/to/resource'),
    fc.constant('email@example.com'),
    fc.constant('100%'),
    fc.constant('a+b'),
    fc.constant('test#anchor'),
    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + ' space'),
    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '&special')
);

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: api-routes-refactoring', () => {
    describe('Property 1: URL Construction Correctness', () => {
        /**
         * **Validates: Requirements 1.4**
         * 
         * For any endpoint path and query parameters, when constructing a full URL using `getFullUrl`,
         * the result should correctly combine the base URL, endpoint path, and properly formatted query string.
         */
        test('should correctly construct URLs with base URL and endpoint', () => {
            fc.assert(
                fc.property(endpointArbitrary, (endpoint) => {
                    const url = ApiRoutes.getFullUrl(endpoint);
                    
                    // Should start with base URL
                    expect(url).toContain(ApiRoutes.BASE_URL);
                    
                    // Should include the endpoint path
                    expect(url).toContain(endpoint);
                    
                    // Should be a valid URL format (base + endpoint)
                    expect(url).toBe(`${ApiRoutes.BASE_URL}${endpoint}`);
                }),
                { numRuns: 20 }
            );
        });

        test('should correctly construct URLs with query parameters', () => {
            fc.assert(
                fc.property(
                    endpointArbitrary,
                    queryParamsArbitrary,
                    (endpoint, params) => {
                        const url = ApiRoutes.getFullUrl(endpoint, params);
                        
                        // Should start with base URL
                        expect(url).toContain(ApiRoutes.BASE_URL);
                        
                        // Should include the endpoint path
                        expect(url).toContain(endpoint);
                        
                        // If params exist, should include query string separator
                        const hasParams = Object.keys(params).length > 0;
                        if (hasParams) {
                            expect(url).toContain('?');
                            
                            // Should include all parameter keys
                            Object.keys(params).forEach(key => {
                                expect(url).toContain(key);
                            });
                        }
                        
                        // URL should be properly formatted
                        const expectedStart = `${ApiRoutes.BASE_URL}${endpoint}`;
                        expect(url.startsWith(expectedStart)).toBe(true);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle empty query parameters', () => {
            fc.assert(
                fc.property(endpointArbitrary, (endpoint) => {
                    const url = ApiRoutes.getFullUrl(endpoint, {});
                    
                    // Should not include query string separator
                    expect(url).not.toContain('?');
                    
                    // Should be exactly base URL + endpoint
                    expect(url).toBe(`${ApiRoutes.BASE_URL}${endpoint}`);
                }),
                { numRuns: 20 }
            );
        });

        test('should handle undefined query parameters', () => {
            fc.assert(
                fc.property(endpointArbitrary, (endpoint) => {
                    const url = ApiRoutes.getFullUrl(endpoint, undefined);
                    
                    // Should not include query string separator
                    expect(url).not.toContain('?');
                    
                    // Should be exactly base URL + endpoint
                    expect(url).toBe(`${ApiRoutes.BASE_URL}${endpoint}`);
                }),
                { numRuns: 20 }
            );
        });

        test('should properly encode query parameter values', () => {
            fc.assert(
                fc.property(
                    endpointArbitrary,
                    fc.dictionary(
                        queryParamKeyArbitrary,
                        specialCharStringArbitrary,
                        { minKeys: 1, maxKeys: 5 }
                    ),
                    (endpoint, params) => {
                        const url = ApiRoutes.getFullUrl(endpoint, params);
                        
                        // Should contain encoded values
                        Object.entries(params).forEach(([key, value]) => {
                            const encodedValue = encodeURIComponent(String(value));
                            expect(url).toContain(`${key}=${encodedValue}`);
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should filter out null and undefined parameter values', () => {
            fc.assert(
                fc.property(
                    endpointArbitrary,
                    queryParamsWithNullsArbitrary,
                    (endpoint, params) => {
                        const url = ApiRoutes.getFullUrl(endpoint, params);
                        
                        // Count non-null parameters
                        const nonNullParams = Object.entries(params).filter(
                            ([_, value]) => value != null
                        );
                        
                        if (nonNullParams.length === 0) {
                            // Should not have query string
                            expect(url).not.toContain('?');
                        } else {
                            // Should only include non-null parameters
                            nonNullParams.forEach(([key, value]) => {
                                expect(url).toContain(key);
                                expect(url).toContain(encodeURIComponent(String(value)));
                            });
                            
                            // Should not include null or undefined in the URL
                            expect(url).not.toContain('null');
                            expect(url).not.toContain('undefined');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle multiple query parameters with & separator', () => {
            fc.assert(
                fc.property(
                    endpointArbitrary,
                    fc.dictionary(
                        queryParamKeyArbitrary,
                        queryParamValueArbitrary,
                        { minKeys: 2, maxKeys: 5 }
                    ),
                    (endpoint, params) => {
                        const url = ApiRoutes.getFullUrl(endpoint, params);
                        
                        const paramCount = Object.keys(params).length;
                        if (paramCount > 1) {
                            // Should contain & separators between parameters
                            // Count the & in the query string part only (after ?)
                            const queryStringPart = url.split('?')[1] || '';
                            const ampersandCount = (queryStringPart.match(/&/g) || []).length;
                            expect(ampersandCount).toBe(paramCount - 1);
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should construct valid URLs that can be parsed', () => {
            fc.assert(
                fc.property(
                    endpointArbitrary,
                    queryParamsArbitrary,
                    (endpoint, params) => {
                        const url = ApiRoutes.getFullUrl(endpoint, params);
                        
                        // Should be parseable as a URL
                        expect(() => new URL(url)).not.toThrow();
                        
                        const parsedUrl = new URL(url);
                        
                        // Verify base URL
                        expect(parsedUrl.origin).toBe(ApiRoutes.BASE_URL);
                        
                        // Verify endpoint is in pathname
                        expect(parsedUrl.pathname).toBe(endpoint);
                        
                        // Verify query parameters
                        Object.entries(params).forEach(([key, value]) => {
                            expect(parsedUrl.searchParams.get(key)).toBe(String(value));
                        });
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('Property 4: Query Parameter Encoding', () => {
        /**
         * **Validates: Requirements 10.2**
         * 
         * For any query parameter value containing special characters (spaces, &, =, ?, etc.),
         * when building query parameters, the value should be properly URL-encoded.
         */
        test('should properly encode special characters in query parameter values', () => {
            fc.assert(
                fc.property(
                    specialCharStringArbitrary,
                    (specialValue) => {
                        const params = { testParam: specialValue };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should encode the value
                        const encodedValue = encodeURIComponent(String(specialValue));
                        expect(queryString).toContain(`testParam=${encodedValue}`);
                        
                        // Should start with ?
                        expect(queryString).toMatch(/^\?/);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode spaces as %20', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + ' ' + s),
                    (valueWithSpaces) => {
                        const params = { key: valueWithSpaces };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Spaces should be encoded as %20
                        expect(queryString).toContain('%20');
                        expect(queryString).not.toContain(' ');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode ampersands to prevent parameter confusion', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '&' + s),
                    (valueWithAmpersand) => {
                        const params = { key: valueWithAmpersand };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Ampersands in values should be encoded as %26
                        const encodedValue = encodeURIComponent(String(valueWithAmpersand));
                        expect(queryString).toContain(encodedValue);
                        
                        // Should only have one unencoded & if there are multiple params
                        // In this case with single param, no unencoded & should appear after the key=
                        const afterEquals = queryString.split('=')[1];
                        if (afterEquals) {
                            expect(afterEquals).not.toMatch(/&(?!%)/); // No unencoded &
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode equals signs to prevent parameter confusion', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '=' + s),
                    (valueWithEquals) => {
                        const params = { key: valueWithEquals };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Equals signs in values should be encoded as %3D
                        const encodedValue = encodeURIComponent(String(valueWithEquals));
                        expect(queryString).toContain(encodedValue);
                        expect(queryString).toContain('%3D');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode question marks', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '?' + s),
                    (valueWithQuestion) => {
                        const params = { key: valueWithQuestion };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Question marks in values should be encoded as %3F
                        const encodedValue = encodeURIComponent(String(valueWithQuestion));
                        expect(queryString).toContain(encodedValue);
                        expect(queryString).toContain('%3F');
                        
                        // Should only have one unencoded ? at the start
                        const questionMarks = queryString.match(/\?/g);
                        expect(questionMarks?.length).toBe(1);
                        expect(queryString.indexOf('?')).toBe(0);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode hash/fragment identifiers', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '#' + s),
                    (valueWithHash) => {
                        const params = { key: valueWithHash };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Hash signs in values should be encoded as %23
                        const encodedValue = encodeURIComponent(String(valueWithHash));
                        expect(queryString).toContain(encodedValue);
                        expect(queryString).toContain('%23');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode plus signs', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '+' + s),
                    (valueWithPlus) => {
                        const params = { key: valueWithPlus };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Plus signs should be encoded as %2B
                        const encodedValue = encodeURIComponent(String(valueWithPlus));
                        expect(queryString).toContain(encodedValue);
                        expect(queryString).toContain('%2B');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should encode percent signs', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).map(s => s + '%' + s),
                    (valueWithPercent) => {
                        const params = { key: valueWithPercent };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Percent signs should be encoded as %25
                        const encodedValue = encodeURIComponent(String(valueWithPercent));
                        expect(queryString).toContain(encodedValue);
                        expect(queryString).toContain('%25');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle multiple special characters in same value', () => {
            fc.assert(
                fc.property(
                    fc.tuple(
                        fc.constantFrom(' ', '&', '=', '?', '#', '+', '%'),
                        fc.constantFrom(' ', '&', '=', '?', '#', '+', '%'),
                        fc.string({ minLength: 1, maxLength: 10 })
                    ).map(([char1, char2, base]) => `${base}${char1}test${char2}value`),
                    (complexValue) => {
                        const params = { key: complexValue };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should properly encode the entire value
                        const encodedValue = encodeURIComponent(String(complexValue));
                        expect(queryString).toBe(`?key=${encodedValue}`);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('Property 5: Null Parameter Filtering', () => {
        /**
         * **Validates: Requirements 10.3**
         * 
         * For any object containing query parameters with null or undefined values,
         * when building query parameters, the resulting query string should not include those parameters.
         */
        test('should filter out null values from query parameters', () => {
            fc.assert(
                fc.property(
                    fc.dictionary(
                        queryParamKeyArbitrary,
                        fc.constant(null),
                        { minKeys: 1, maxKeys: 5 }
                    ),
                    (paramsWithNulls) => {
                        const queryString = ApiRoutes.buildQueryParams(paramsWithNulls);
                        
                        // Should return empty string for all-null params
                        expect(queryString).toBe('');
                        
                        // Should not contain 'null' string
                        expect(queryString).not.toContain('null');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should filter out undefined values from query parameters', () => {
            fc.assert(
                fc.property(
                    fc.dictionary(
                        queryParamKeyArbitrary,
                        fc.constant(undefined),
                        { minKeys: 1, maxKeys: 5 }
                    ),
                    (paramsWithUndefined) => {
                        const queryString = ApiRoutes.buildQueryParams(paramsWithUndefined);
                        
                        // Should return empty string for all-undefined params
                        expect(queryString).toBe('');
                        
                        // Should not contain 'undefined' string
                        expect(queryString).not.toContain('undefined');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include non-null values while filtering null values', () => {
            fc.assert(
                fc.property(
                    queryParamKeyArbitrary,
                    queryParamValueArbitrary,
                    queryParamKeyArbitrary,
                    (validKey, validValue, nullKey) => {
                        // Ensure keys are different and nullKey is not a substring of validKey
                        fc.pre(validKey !== nullKey && !validKey.includes(nullKey));
                        
                        const params = {
                            [validKey]: validValue,
                            [nullKey]: null
                        };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should include the valid parameter
                        expect(queryString).toContain(validKey);
                        expect(queryString).toContain(encodeURIComponent(String(validValue)));
                        
                        // Should not include the null parameter key
                        expect(queryString).not.toContain(`${nullKey}=`);
                        
                        // Should not contain 'null' string
                        expect(queryString).not.toContain('null');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should include non-undefined values while filtering undefined values', () => {
            fc.assert(
                fc.property(
                    queryParamKeyArbitrary,
                    queryParamValueArbitrary,
                    queryParamKeyArbitrary,
                    (validKey, validValue, undefinedKey) => {
                        // Ensure keys are different and undefinedKey is not a substring of validKey
                        fc.pre(validKey !== undefinedKey && !validKey.includes(undefinedKey));
                        
                        const params = {
                            [validKey]: validValue,
                            [undefinedKey]: undefined
                        };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should include the valid parameter
                        expect(queryString).toContain(validKey);
                        expect(queryString).toContain(encodeURIComponent(String(validValue)));
                        
                        // Should not include the undefined parameter key
                        expect(queryString).not.toContain(`${undefinedKey}=`);
                        
                        // Should not contain 'undefined' string
                        expect(queryString).not.toContain('undefined');
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle mixed null, undefined, and valid values', () => {
            fc.assert(
                fc.property(
                    fc.dictionary(
                        queryParamKeyArbitrary,
                        fc.oneof(
                            queryParamValueArbitrary,
                            fc.constant(null),
                            fc.constant(undefined)
                        ),
                        { minKeys: 3, maxKeys: 10 }
                    ),
                    (mixedParams) => {
                        const queryString = ApiRoutes.buildQueryParams(mixedParams);
                        
                        // Count non-null/undefined parameters
                        const validParams = Object.entries(mixedParams).filter(
                            ([_, value]) => value != null
                        );
                        
                        if (validParams.length === 0) {
                            // Should be empty if all params are null/undefined
                            expect(queryString).toBe('');
                        } else {
                            // Should include all valid parameters
                            validParams.forEach(([key, value]) => {
                                expect(queryString).toContain(key);
                                expect(queryString).toContain(encodeURIComponent(String(value)));
                            });
                            
                            // Should not contain 'null' or 'undefined' strings
                            expect(queryString).not.toContain('null');
                            expect(queryString).not.toContain('undefined');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle empty object', () => {
            const queryString = ApiRoutes.buildQueryParams({});
            expect(queryString).toBe('');
        });

        test('should treat zero and false as valid values (not filter them)', () => {
            fc.assert(
                fc.property(
                    queryParamKeyArbitrary,
                    queryParamKeyArbitrary,
                    (zeroKey, falseKey) => {
                        // Ensure keys are different
                        fc.pre(zeroKey !== falseKey);
                        
                        const params = {
                            [zeroKey]: 0,
                            [falseKey]: false
                        };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should include both parameters (0 and false are valid values)
                        expect(queryString).toContain(`${zeroKey}=0`);
                        expect(queryString).toContain(`${falseKey}=false`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should treat empty string as valid value (not filter it)', () => {
            fc.assert(
                fc.property(
                    queryParamKeyArbitrary,
                    (key) => {
                        const params = { [key]: '' };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should include the parameter with empty value
                        expect(queryString).toContain(`${key}=`);
                        expect(queryString).toBe(`?${key}=`);
                    }
                ),
                { numRuns: 20 }
            );
        });
    });

    describe('Property 6: Query Parameter Support', () => {
        /**
         * **Validates: Requirements 2.6, 2.7, 10.4, 10.5, 10.6**
         * 
         * For any valid combination of pagination parameters (limit, offset),
         * filter parameters (type, status, search), and location parameters (lat, lng, radius),
         * when building query parameters, all non-null parameters should appear in the query string
         * with correct encoding.
         */
        
        // Generator for pagination parameters
        const paginationParamsArbitrary = fc.record({
            limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null }),
            offset: fc.option(fc.integer({ min: 0, max: 1000 }), { nil: null })
        });

        // Generator for filter parameters
        const filterParamsArbitrary = fc.record({
            type: fc.option(fc.constantFrom('image', 'video', 'document', 'all'), { nil: null }),
            status: fc.option(fc.constantFrom('draft', 'active', 'paused', 'expired', 'all'), { nil: null }),
            search: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null })
        });

        // Generator for location parameters
        const locationParamsArbitrary = fc.record({
            lat: fc.option(fc.double({ min: -90, max: 90, noNaN: true }), { nil: null }),
            lng: fc.option(fc.double({ min: -180, max: 180, noNaN: true }), { nil: null }),
            radius: fc.option(fc.integer({ min: 1, max: 100 }), { nil: null })
        });

        test('should support pagination parameters (limit, offset)', () => {
            fc.assert(
                fc.property(
                    paginationParamsArbitrary,
                    (params) => {
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Check each non-null parameter is included
                        if (params.limit != null) {
                            expect(queryString).toContain(`limit=${params.limit}`);
                        } else {
                            expect(queryString).not.toContain('limit=');
                        }
                        
                        if (params.offset != null) {
                            expect(queryString).toContain(`offset=${params.offset}`);
                        } else {
                            expect(queryString).not.toContain('offset=');
                        }
                        
                        // If all params are null, should be empty
                        if (params.limit == null && params.offset == null) {
                            expect(queryString).toBe('');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should support filter parameters (type, status, search)', () => {
            fc.assert(
                fc.property(
                    filterParamsArbitrary,
                    (params) => {
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Check each non-null parameter is included
                        if (params.type != null) {
                            expect(queryString).toContain(`type=${params.type}`);
                        } else {
                            expect(queryString).not.toContain('type=');
                        }
                        
                        if (params.status != null) {
                            expect(queryString).toContain(`status=${params.status}`);
                        } else {
                            expect(queryString).not.toContain('status=');
                        }
                        
                        if (params.search != null) {
                            expect(queryString).toContain('search=');
                            expect(queryString).toContain(encodeURIComponent(params.search));
                        } else {
                            expect(queryString).not.toContain('search=');
                        }
                        
                        // If all params are null, should be empty
                        if (params.type == null && params.status == null && params.search == null) {
                            expect(queryString).toBe('');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should support location parameters (lat, lng, radius)', () => {
            fc.assert(
                fc.property(
                    locationParamsArbitrary,
                    (params) => {
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Check each non-null parameter is included
                        if (params.lat != null) {
                            expect(queryString).toContain('lat=');
                            expect(queryString).toContain(String(params.lat));
                        } else {
                            expect(queryString).not.toContain('lat=');
                        }
                        
                        if (params.lng != null) {
                            expect(queryString).toContain('lng=');
                            expect(queryString).toContain(String(params.lng));
                        } else {
                            expect(queryString).not.toContain('lng=');
                        }
                        
                        if (params.radius != null) {
                            expect(queryString).toContain(`radius=${params.radius}`);
                        } else {
                            expect(queryString).not.toContain('radius=');
                        }
                        
                        // If all params are null, should be empty
                        if (params.lat == null && params.lng == null && params.radius == null) {
                            expect(queryString).toBe('');
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should support combined pagination and filter parameters', () => {
            fc.assert(
                fc.property(
                    paginationParamsArbitrary,
                    filterParamsArbitrary,
                    (paginationParams, filterParams) => {
                        const combinedParams = { ...paginationParams, ...filterParams };
                        const queryString = ApiRoutes.buildQueryParams(combinedParams);
                        
                        // Count non-null parameters
                        const nonNullParams = Object.entries(combinedParams).filter(
                            ([_, value]) => value != null
                        );
                        
                        if (nonNullParams.length === 0) {
                            expect(queryString).toBe('');
                        } else {
                            // Should include all non-null parameters
                            nonNullParams.forEach(([key, value]) => {
                                expect(queryString).toContain(key);
                            });
                            
                            // Should have correct number of separators
                            if (nonNullParams.length > 1) {
                                const ampersandCount = (queryString.match(/&/g) || []).length;
                                expect(ampersandCount).toBe(nonNullParams.length - 1);
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should support combined pagination, filter, and location parameters', () => {
            fc.assert(
                fc.property(
                    paginationParamsArbitrary,
                    filterParamsArbitrary,
                    locationParamsArbitrary,
                    (paginationParams, filterParams, locationParams) => {
                        const combinedParams = { ...paginationParams, ...filterParams, ...locationParams };
                        const queryString = ApiRoutes.buildQueryParams(combinedParams);
                        
                        // Count non-null parameters
                        const nonNullParams = Object.entries(combinedParams).filter(
                            ([_, value]) => value != null
                        );
                        
                        if (nonNullParams.length === 0) {
                            expect(queryString).toBe('');
                        } else {
                            // Should start with ?
                            expect(queryString).toMatch(/^\?/);
                            
                            // Should include all non-null parameters
                            nonNullParams.forEach(([key, value]) => {
                                expect(queryString).toContain(key);
                                // Verify the value is properly encoded
                                const encodedValue = encodeURIComponent(String(value));
                                expect(queryString).toContain(`${key}=${encodedValue}`);
                            });
                            
                            // Should have correct number of separators
                            if (nonNullParams.length > 1) {
                                const ampersandCount = (queryString.match(/&/g) || []).length;
                                expect(ampersandCount).toBe(nonNullParams.length - 1);
                            }
                        }
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle search parameter with special characters', () => {
            fc.assert(
                fc.property(
                    specialCharStringArbitrary,
                    (searchValue) => {
                        const params = { search: searchValue };
                        const queryString = ApiRoutes.buildQueryParams(params);
                        
                        // Should properly encode the search value
                        const encodedValue = encodeURIComponent(String(searchValue));
                        expect(queryString).toBe(`?search=${encodedValue}`);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should maintain parameter order consistency', () => {
            fc.assert(
                fc.property(
                    paginationParamsArbitrary,
                    filterParamsArbitrary,
                    (paginationParams, filterParams) => {
                        const combinedParams = { ...paginationParams, ...filterParams };
                        
                        // Build query string twice
                        const queryString1 = ApiRoutes.buildQueryParams(combinedParams);
                        const queryString2 = ApiRoutes.buildQueryParams(combinedParams);
                        
                        // Should produce identical results
                        expect(queryString1).toBe(queryString2);
                    }
                ),
                { numRuns: 20 }
            );
        });

        test('should handle all parameter types with maximum values', () => {
            const maxParams = {
                limit: 100,
                offset: 1000,
                type: 'image' as const,
                status: 'active' as const,
                search: 'test search query with spaces',
                lat: 45.5,
                lng: -73.6,
                radius: 50
            };
            
            const queryString = ApiRoutes.buildQueryParams(maxParams);
            
            // Should include all parameters
            expect(queryString).toContain('limit=100');
            expect(queryString).toContain('offset=1000');
            expect(queryString).toContain('type=image');
            expect(queryString).toContain('status=active');
            expect(queryString).toContain('search=test%20search%20query%20with%20spaces');
            expect(queryString).toContain('lat=45.5');
            expect(queryString).toContain('lng=-73.6');
            expect(queryString).toContain('radius=50');
            
            // Should have 7 ampersands (8 params - 1)
            const ampersandCount = (queryString.match(/&/g) || []).length;
            expect(ampersandCount).toBe(7);
        });
    });
});
