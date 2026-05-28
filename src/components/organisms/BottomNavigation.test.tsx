/**
 * Unit tests for BottomNavigation component
 * 
 * Tests the notifications menu item functionality.
 * 
 * Feature: map-routes-and-notifications
 */

import { render, fireEvent } from '@testing-library/react-native';
import { BottomNavigation } from './BottomNavigation';

// Mock dependencies
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
    }),
}));

// ============================================================================
// Unit Tests
// ============================================================================

describe('BottomNavigation - Notifications Menu Item', () => {
    /**
     * **Validates: Requirements 4.1**
     * 
     * Test that Notifications button exists in navigation
     */
    test('should render Notifications button in navigation', () => {
        const { getByText } = render(
            <BottomNavigation />
        );

        // Verify the Notifications button is present
        expect(getByText('Notifications')).toBeTruthy();
    });

    /**
     * **Validates: Requirements 4.1, 4.2**
     * 
     * Test that tapping button triggers onNotificationsPress
     */
    test('should trigger onNotificationsPress when Notifications button is tapped', () => {
        const onNotificationsPress = jest.fn();
        
        const { getByText } = render(
            <BottomNavigation
                onNotificationsPress={onNotificationsPress}
            />
        );

        // Tap the Notifications button
        const notificationsButton = getByText('Notifications');
        fireEvent.press(notificationsButton);

        // Verify the callback was called
        expect(onNotificationsPress).toHaveBeenCalledTimes(1);
    });

    /**
     * **Validates: Requirements 4.1, 4.2**
     * 
     * Test that badge displays correct count
     */
    test('should display notification count badge when count > 0', () => {
        const { getByText } = render(
            <BottomNavigation
                notificationCount={5}
            />
        );

        // Verify the badge displays the correct count
        expect(getByText('5')).toBeTruthy();
    });

    test('should display "9+" when notification count exceeds 9', () => {
        const { getByText } = render(
            <BottomNavigation
                notificationCount={15}
            />
        );

        // Verify the badge displays "9+" for counts > 9
        expect(getByText('9+')).toBeTruthy();
    });

    test('should not display badge when notification count is 0', () => {
        const { queryByText } = render(
            <BottomNavigation
                notificationCount={0}
            />
        );

        // Verify no badge is displayed (no numeric text should be present)
        // We check that there's no "0" text in the badge
        expect(queryByText('0')).toBeNull();
    });

    test('should not display badge when notificationCount is not provided', () => {
        const { queryByText } = render(
            <BottomNavigation />
        );

        // Verify no badge is displayed by default
        // The component should still render the Notifications button
        expect(queryByText('Notifications')).toBeTruthy();
        // But no numeric badge should be present
        expect(queryByText(/^\d+$/)).toBeNull();
    });
});
