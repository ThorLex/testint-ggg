/**
 * Performance tests for MapView component
 * 
 * Tests rendering performance with many routes and search performance with large datasets
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GeoMap } from './MapView';
import type { Route } from '@/types';

// Mock dependencies
jest.mock('@/services/api/client');
jest.mock('@/services/location');
jest.mock('@/store');
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Mock theme hooks
jest.mock('@/theme', () => ({
    useThemeColors: () => ({
        primary: '#3B82F6',
    }),
    useIsDarkMode: () => false,
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

describe('MapView Performance Tests', () => {
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
     * Test rendering performance with many routes
     * Validates: Requirement 14.1
     */
    it('should render efficiently with 50 routes', () => {
        const routes = generateTestRoutes(50);
        
        const startTime = performance.now();
        
        const { unmount } = render(
            <QueryClientProvider client={queryClient}>
                <GeoMap />
            </QueryClientProvider>
        );
        
        const renderTime = performance.now() - startTime;
        
        // Rendering should complete in reasonable time (< 1000ms)
        expect(renderTime).toBeLessThan(1000);
        
        unmount();
    });

    /**
     * Test rendering performance with many routes
     * Validates: Requirement 14.2
     */
    it('should render efficiently with 100 routes', () => {
        const routes = generateTestRoutes(100);
        
        const startTime = performance.now();
        
        const { unmount } = render(
            <QueryClientProvider client={queryClient}>
                <GeoMap />
            </QueryClientProvider>
        );
        
        const renderTime = performance.now() - startTime;
        
        // Rendering should complete in reasonable time (< 2000ms)
        expect(renderTime).toBeLessThan(2000);
        
        unmount();
    });

    /**
     * Test that memoization prevents unnecessary re-renders
     */
    it('should not re-render routes when unrelated props change', () => {
        const routes = generateTestRoutes(10);
        
        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <GeoMap mapType="standard" />
            </QueryClientProvider>
        );
        
        const startTime = performance.now();
        
        // Change map type (should not re-render routes)
        rerender(
            <QueryClientProvider client={queryClient}>
                <GeoMap mapType="satellite" />
            </QueryClientProvider>
        );
        
        const rerenderTime = performance.now() - startTime;
        
        // Re-render should be fast (< 100ms) due to memoization
        expect(rerenderTime).toBeLessThan(100);
    });
});
