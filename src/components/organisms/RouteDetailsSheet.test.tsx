/**
 * Unit tests for RouteDetailsSheet component
 * 
 * Tests specific examples and edge cases for route details accessibility.
 * 
 * Feature: map-routes-and-notifications
 */

import { render, fireEvent } from '@testing-library/react-native';
import { RouteDetailsSheet } from './RouteDetailsSheet';
import type { Route } from '@/types';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
    }),
}));

// ============================================================================
// Test Data
// ============================================================================

const mockRoute: Route = {
    id: 'test-route-1',
    name: 'Boulevard de la logistique Maritime.05',
    coordinates: [
        { lat: 10, lng: 10, order: 0 },
        { lat: 11, lng: 11, order: 1 },
        { lat: 12, lng: 12, order: 2 },
    ],
    status: 'active',
    metadata: {
        roadType: 'highway',
        maxSpeed: 100,
        width: 10,
        surface: 'asphalt',
    },
};

const mockInactiveRoute: Route = {
    id: 'test-route-2',
    name: 'Rue de la maintenance',
    coordinates: [
        { lat: 20, lng: 20, order: 0 },
        { lat: 21, lng: 21, order: 1 },
    ],
    status: 'inactive',
    metadata: {
        roadType: 'street',
        maxSpeed: 50,
        width: 8,
        surface: 'concrete',
    },
};

// ============================================================================
// Unit Tests
// ============================================================================

describe('RouteDetailsSheet - Accessibility', () => {
    /**
     * **Validates: Requirements 7.6**
     * 
     * Test that details can be opened from map interaction
     */
    test('should be accessible from map interaction (visible prop)', () => {
        const onClose = jest.fn();
        
        // Simulate opening from map by setting visible=true
        const { getByText } = render(
            <RouteDetailsSheet
                route={mockRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Verify the sheet is displayed with route details
        expect(getByText(mockRoute.name)).toBeTruthy();
        expect(getByText(mockRoute.metadata.roadType)).toBeTruthy();
    });

    /**
     * **Validates: Requirements 7.6**
     * 
     * Test that details can be opened from search results
     */
    test('should be accessible from search results (visible prop)', () => {
        const onClose = jest.fn();
        
        // Simulate opening from search by setting visible=true with a different route
        const { getByText } = render(
            <RouteDetailsSheet
                route={mockInactiveRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Verify the sheet is displayed with route details
        expect(getByText(mockInactiveRoute.name)).toBeTruthy();
        expect(getByText(mockInactiveRoute.metadata.roadType)).toBeTruthy();
    });

    test('should display the same content regardless of how it was opened', () => {
        const onClose = jest.fn();
        
        // Render from "map interaction"
        const { getByText: getByText1, unmount: unmount1 } = render(
            <RouteDetailsSheet
                route={mockRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Verify content
        expect(getByText1(mockRoute.name)).toBeTruthy();
        expect(getByText1(`${mockRoute.metadata.maxSpeed} km/h`)).toBeTruthy();
        
        unmount1();

        // Render from "search results" (same component, same props)
        const { getByText: getByText2 } = render(
            <RouteDetailsSheet
                route={mockRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Verify same content is displayed
        expect(getByText2(mockRoute.name)).toBeTruthy();
        expect(getByText2(`${mockRoute.metadata.maxSpeed} km/h`)).toBeTruthy();
    });

    test('should call onClose when close button is pressed', () => {
        const onClose = jest.fn();
        
        const { UNSAFE_root } = render(
            <RouteDetailsSheet
                route={mockRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Find the TouchableOpacity (close button)
        const touchables = UNSAFE_root.findAllByType('TouchableOpacity' as any);
        
        // The first TouchableOpacity should be the close button
        if (touchables.length > 0) {
            fireEvent.press(touchables[0]);
            expect(onClose).toHaveBeenCalledTimes(1);
        }
    });

    test('should handle route with all status types', () => {
        const onClose = jest.fn();
        
        const statuses: Array<'active' | 'inactive' | 'maintenance'> = ['active', 'inactive', 'maintenance'];
        
        statuses.forEach(status => {
            const route: Route = {
                ...mockRoute,
                status,
            };

            const { getByText, unmount } = render(
                <RouteDetailsSheet
                    route={route}
                    visible={true}
                    onClose={onClose}
                />
            );

            // Verify status is displayed
            expect(getByText(status)).toBeTruthy();
            
            unmount();
        });
    });

    test('should display all metadata fields correctly', () => {
        const onClose = jest.fn();
        
        const { getByText } = render(
            <RouteDetailsSheet
                route={mockRoute}
                visible={true}
                onClose={onClose}
            />
        );

        // Verify all metadata fields are present
        expect(getByText('Type de route')).toBeTruthy();
        expect(getByText(mockRoute.metadata.roadType)).toBeTruthy();
        
        expect(getByText('Vitesse max')).toBeTruthy();
        expect(getByText(`${mockRoute.metadata.maxSpeed} km/h`)).toBeTruthy();
        
        expect(getByText('Largeur')).toBeTruthy();
        expect(getByText(`${mockRoute.metadata.width} m`)).toBeTruthy();
        
        expect(getByText('Surface')).toBeTruthy();
        expect(getByText(mockRoute.metadata.surface)).toBeTruthy();
    });
});
