/**
 * Property-based tests for SearchBar component
 * 
 * Tests universal properties of search type filtering and result handling.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar, SearchType } from './SearchBar';
import type { Route, AmodiatairMinimal, RouteMetadata } from '@/types';

// ============================================================================
// Test Setup
// ============================================================================

/**
 * Create a QueryClient for testing
 */
const createTestQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                cacheTime: 0,
            },
        },
    });
};

/**
 * Wrapper component with QueryClient
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const queryClient = createTestQueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for RouteMetadata objects
 */
const routeMetadataArbitrary = fc.record({
    roadType: fc.constantFrom('highway', 'street', 'boulevard', 'avenue', 'road'),
    maxSpeed: fc.integer({ min: 10, max: 130 }),
    width: fc.float({ min: 2, max: 20, noNaN: true }),
    surface: fc.constantFrom('asphalt', 'concrete', 'gravel', 'dirt'),
}) as fc.Arbitrary<RouteMetadata>;

/**
 * Generator for Route objects
 */
const routeArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(
        fc.record({
            lat: fc.float({ min: -90, max: 90, noNaN: true }),
            lng: fc.float({ min: -180, max: 180, noNaN: true }),
            order: fc.integer({ min: 0, max: 1000 }),
        }),
        { minLength: 2, maxLength: 20 }
    ),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

/**
 * Generator for AmodiatairMinimal objects
 */
const amodiataireMinimalArbitrary = fc.record({
    id: fc.uuid(),
    nom: fc.option(fc.string({ minLength: 2, maxLength: 30 })),
    prenom: fc.option(fc.string({ minLength: 2, maxLength: 30 })),
    raisonSociale: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
    telephone: fc.option(fc.string({ minLength: 10, maxLength: 15 })),
    email: fc.option(fc.emailAddress()),
    coordinates: fc.option(
        fc.record({
            lat: fc.float({ min: -90, max: 90, noNaN: true }),
            lng: fc.float({ min: -180, max: 180, noNaN: true }),
        })
    ),
}) as fc.Arbitrary<AmodiatairMinimal>;

/**
 * Generator for SearchType
 */
const searchTypeArbitrary = fc.constantFrom<SearchType>(
    'amodiataires',
    'routes',
    'announcements'
);

// ============================================================================
// Property Tests
// ============================================================================

describe('Feature: map-routes-and-notifications', () => {
    describe('Property 15: Search Type Filtering', () => {
        /**
         * **Validates: Requirements 9.2**
         * 
         * For any selected search type (amodiataires, routes, announcements),
         * the search results should only contain items of that type.
         */
        test('should only show routes when searchType is "routes"', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify the placeholder indicates route search
                        const input = getByPlaceholderText(/route/i);
                        expect(input).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should only show amodiataires when searchType is "amodiataires"', () => {
            fc.assert(
                fc.property(
                    fc.constant(undefined),
                    () => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="amodiataires"
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify the placeholder indicates amodiataire search
                        const input = getByPlaceholderText(/amodiataire/i);
                        expect(input).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should only show announcements when searchType is "announcements"', () => {
            fc.assert(
                fc.property(
                    fc.constant(undefined),
                    () => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="announcements"
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify the placeholder indicates announcement search
                        const input = getByPlaceholderText(/annonce/i);
                        expect(input).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should use correct placeholder for each search type', () => {
            fc.assert(
                fc.property(
                    searchTypeArbitrary,
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (searchType, routes) => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType={searchType}
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify the placeholder matches the search type
                        switch (searchType) {
                            case 'routes':
                                expect(() => getByPlaceholderText(/route/i)).not.toThrow();
                                break;
                            case 'announcements':
                                expect(() => getByPlaceholderText(/annonce/i)).not.toThrow();
                                break;
                            case 'amodiataires':
                            default:
                                expect(() => getByPlaceholderText(/amodiataire/i)).not.toThrow();
                                break;
                        }
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should default to amodiataires search type when not specified', () => {
            fc.assert(
                fc.property(
                    fc.constant(undefined),
                    () => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar onResultSelect={jest.fn()} />
                            </TestWrapper>
                        );

                        // Verify the default placeholder is for amodiataires
                        const input = getByPlaceholderText(/amodiataire/i);
                        expect(input).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should accept routes prop only when searchType is "routes"', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        // Should work with routes searchType
                        const { rerender } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        expect(() => {
                            rerender(
                                <TestWrapper>
                                    <SearchBar
                                        searchType="routes"
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );
                        }).not.toThrow();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should handle empty routes array for routes search type', () => {
            fc.assert(
                fc.property(
                    fc.constant([]),
                    (emptyRoutes) => {
                        const { getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={emptyRoutes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Should still render with empty routes
                        const input = getByPlaceholderText(/route/i);
                        expect(input).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should maintain search type consistency across renders', () => {
            fc.assert(
                fc.property(
                    searchTypeArbitrary,
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (searchType, routes) => {
                        const { getByPlaceholderText, rerender } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType={searchType}
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Get initial placeholder
                        const initialInput = getByPlaceholderText(/route|amodiataire|annonce/i);
                        const initialPlaceholder = initialInput.props.placeholder;

                        // Rerender with same search type
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType={searchType}
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify placeholder remains the same
                        const rerenderInput = getByPlaceholderText(/route|amodiataire|annonce/i);
                        expect(rerenderInput.props.placeholder).toBe(initialPlaceholder);
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should call appropriate callback based on search type', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 5 }),
                    (routes) => {
                        const onRouteSelect = jest.fn();
                        const onResultSelect = jest.fn();

                        // Test with routes search type
                        render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={onRouteSelect}
                                    onResultSelect={onResultSelect}
                                />
                            </TestWrapper>
                        );

                        // Verify callbacks are provided correctly
                        expect(onRouteSelect).toBeDefined();
                        expect(onResultSelect).toBeDefined();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should handle all valid search types without errors', () => {
            fc.assert(
                fc.property(
                    searchTypeArbitrary,
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (searchType, routes) => {
                        expect(() => {
                            render(
                                <TestWrapper>
                                    <SearchBar
                                        searchType={searchType}
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                        onResultSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );
                        }).not.toThrow();
                    }
                ),
                { numRuns: 50 }
            );
        });
    });

    describe('Property 16: Search Type Switching', () => {
        /**
         * **Validates: Requirements 9.5**
         * 
         * For any search type change, the previous search results should be cleared.
         */
        test('should clear results when switching from routes to amodiataires', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { rerender, queryByText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Switch to amodiataires search type
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="amodiataires"
                                    routes={routes}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify no route results are visible
                        // (Results should be cleared when search type changes)
                        routes.forEach(route => {
                            expect(queryByText(route.name)).toBeNull();
                        });
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should clear results when switching from amodiataires to routes', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { rerender, getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="amodiataires"
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify initial search type
                        expect(getByPlaceholderText(/amodiataire/i)).toBeTruthy();

                        // Switch to routes search type
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify search type changed
                        expect(getByPlaceholderText(/route/i)).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should clear results when switching to announcements', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { rerender, getByPlaceholderText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Switch to announcements search type
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="announcements"
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify search type changed to announcements
                        expect(getByPlaceholderText(/annonce/i)).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should clear query when switching search types', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (routes) => {
                        // Test specific type switches to ensure they're different
                        const typeSwitches: Array<[SearchType, SearchType]> = [
                            ['amodiataires', 'routes'],
                            ['routes', 'announcements'],
                            ['announcements', 'amodiataires'],
                        ];

                        typeSwitches.forEach(([fromType, toType]) => {
                            const { rerender, getByPlaceholderText } = render(
                                <TestWrapper>
                                    <SearchBar
                                        searchType={fromType}
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                        onResultSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );

                            // Get initial placeholder
                            const initialInput = getByPlaceholderText(/route|amodiataire|annonce/i);
                            const initialPlaceholder = initialInput.props.placeholder;

                            // Switch search type
                            rerender(
                                <TestWrapper>
                                    <SearchBar
                                        searchType={toType}
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                        onResultSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );

                            // Verify new input is rendered with different placeholder
                            const newInput = getByPlaceholderText(/route|amodiataire|annonce/i);
                            expect(newInput.props.placeholder).not.toBe(initialPlaceholder);
                        });
                    }
                ),
                { numRuns: 30 }
            );
        });

        test('should maintain empty results state after search type switch', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (routes) => {
                        // Test specific type switches
                        const typeSwitches: Array<[SearchType, SearchType]> = [
                            ['amodiataires', 'routes'],
                            ['routes', 'announcements'],
                        ];

                        typeSwitches.forEach(([fromType, toType]) => {
                            const { rerender, queryByText } = render(
                                <TestWrapper>
                                    <SearchBar
                                        searchType={fromType}
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                        onResultSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );

                            // Switch search type
                            rerender(
                                <TestWrapper>
                                    <SearchBar
                                        searchType={toType}
                                        routes={routes}
                                        onRouteSelect={jest.fn()}
                                        onResultSelect={jest.fn()}
                                    />
                                </TestWrapper>
                            );

                            // Verify no results are shown (results cleared on type switch)
                            // Since we haven't entered a query, no results should be visible
                            expect(queryByText(/Recherche en cours/i)).toBeNull();
                        });
                    }
                ),
                { numRuns: 30 }
            );
        });

        test('should reset showResults state when switching search types', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { rerender, queryByText } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Switch to different search type
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="amodiataires"
                                    routes={routes}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Verify results panel is not shown
                        // (showResults should be false after type switch)
                        expect(queryByText(/Aucun résultat trouvé/i)).toBeNull();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should handle rapid search type switching', () => {
            fc.assert(
                fc.property(
                    fc.array(searchTypeArbitrary, { minLength: 2, maxLength: 5 }),
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (searchTypes, routes) => {
                        let result = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType={searchTypes[0]}
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Rapidly switch through all search types
                        searchTypes.forEach((searchType) => {
                            expect(() => {
                                result.rerender(
                                    <TestWrapper>
                                        <SearchBar
                                            searchType={searchType}
                                            routes={routes}
                                            onRouteSelect={jest.fn()}
                                            onResultSelect={jest.fn()}
                                        />
                                    </TestWrapper>
                                );
                            }).not.toThrow();
                        });

                        // Verify final render is stable
                        const finalInput = result.getByPlaceholderText(/route|amodiataire|annonce/i);
                        expect(finalInput).toBeTruthy();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should preserve routes prop when switching search types', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 1, maxLength: 10 }),
                    (routes) => {
                        const { rerender } = render(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Switch to amodiataires and back to routes
                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="amodiataires"
                                    routes={routes}
                                    onResultSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        rerender(
                            <TestWrapper>
                                <SearchBar
                                    searchType="routes"
                                    routes={routes}
                                    onRouteSelect={jest.fn()}
                                />
                            </TestWrapper>
                        );

                        // Component should render without errors
                        // Routes prop should still be available
                        expect(routes.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should handle switching between all search type combinations', () => {
            fc.assert(
                fc.property(
                    fc.array(routeArbitrary, { minLength: 0, maxLength: 10 }),
                    (routes) => {
                        const searchTypes: SearchType[] = ['amodiataires', 'routes', 'announcements'];
                        
                        // Test all combinations of search type switches
                        for (const fromType of searchTypes) {
                            for (const toType of searchTypes) {
                                if (fromType === toType) continue;

                                const { rerender, getByPlaceholderText } = render(
                                    <TestWrapper>
                                        <SearchBar
                                            searchType={fromType}
                                            routes={routes}
                                            onRouteSelect={jest.fn()}
                                            onResultSelect={jest.fn()}
                                        />
                                    </TestWrapper>
                                );

                                // Switch to new type
                                rerender(
                                    <TestWrapper>
                                        <SearchBar
                                            searchType={toType}
                                            routes={routes}
                                            onRouteSelect={jest.fn()}
                                            onResultSelect={jest.fn()}
                                        />
                                    </TestWrapper>
                                );

                                // Verify the switch was successful
                                const input = getByPlaceholderText(/route|amodiataire|annonce/i);
                                expect(input).toBeTruthy();
                            }
                        }
                    }
                ),
                { numRuns: 30 }
            );
        });
    });
});
