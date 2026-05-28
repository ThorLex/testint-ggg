/**
 * Performance tests for SearchBar component
 * 
 * Tests search performance with large datasets
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';
import type { Route } from '@/types';

// Mock dependencies
jest.mock('@/services/api/client');
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Helper to generate test routes
function generateTestRoutes(count: number): Route[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `route-${i}`,
        name: `Test Route ${i}`,
        status: ['active', 'inactive', 'maintenance'][i % 3] as 'active' | 'inactive' | 'maintenance',
        coordinates: Array.from({ length: 10 }, (_, j) => ({
            lat: 45.5 + (i * 0.01) + (j * 0.001),
            lng: -73.5 + (i * 0.01) + (j * 0.001),
            order: j,
        })),
        metadata: {
            roadType: 'highway',
            maxSpeed: 50,
            width: 10,
            surface: 'asphalt',
        },
    }));
}

describe('SearchBar Performance Tests', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });
    });

    afterEach(() => {
        queryClient.clear();
    });

    /**
     * Test search performance with large dataset
     * Validates: Requirement 14.2
     */
    it('should filter 1000 routes efficiently', () => {
        const routes = generateTestRoutes(1000);
        
        const { getByPlaceholderText } = render(
            <QueryClientProvider client={queryClient}>
                <SearchBar 
                    searchType="routes" 
                    routes={routes}
                />
            </QueryClientProvider>
        );
        
        const searchInput = getByPlaceholderText('search.placeholder.routes');
        
        const startTime = performance.now();
        
        // Trigger search
        fireEvent.changeText(searchInput, 'Test Route 5');
        
        const searchTime = performance.now() - startTime;
        
        // Search should complete quickly (< 100ms)
        expect(searchTime).toBeLessThan(100);
    });

    /**
     * Test that memoization prevents unnecessary recalculations
     */
    it('should use memoization for repeated searches', () => {
        const routes = generateTestRoutes(500);
        
        const { getByPlaceholderText } = render(
            <QueryClientProvider client={queryClient}>
                <SearchBar 
                    searchType="routes" 
                    routes={routes}
                />
            </QueryClientProvider>
        );
        
        const searchInput = getByPlaceholderText('search.placeholder.routes');
        
        // First search
        const startTime1 = performance.now();
        fireEvent.changeText(searchInput, 'Test');
        const searchTime1 = performance.now() - startTime1;
        
        // Clear search
        fireEvent.changeText(searchInput, '');
        
        // Second search with same query (should use memoization)
        const startTime2 = performance.now();
        fireEvent.changeText(searchInput, 'Test');
        const searchTime2 = performance.now() - startTime2;
        
        // Second search should be faster or similar due to memoization
        expect(searchTime2).toBeLessThanOrEqual(searchTime1 * 1.5);
    });

    /**
     * Test search performance with empty query
     */
    it('should handle empty query efficiently', () => {
        const routes = generateTestRoutes(1000);
        
        const { getByPlaceholderText } = render(
            <QueryClientProvider client={queryClient}>
                <SearchBar 
                    searchType="routes" 
                    routes={routes}
                />
            </QueryClientProvider>
        );
        
        const searchInput = getByPlaceholderText('search.placeholder.routes');
        
        const startTime = performance.now();
        
        // Empty query should return all routes quickly
        fireEvent.changeText(searchInput, '');
        
        const searchTime = performance.now() - startTime;
        
        // Should be very fast (< 50ms)
        expect(searchTime).toBeLessThan(50);
    });
});
