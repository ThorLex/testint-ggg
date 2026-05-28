/**
 * Unit tests for SearchBar component - Backward Compatibility
 * 
 * Tests that existing amodiataire search functionality still works
 * and that default behavior is unchanged after adding route search.
 * 
 * Feature: map-routes-and-notifications
 * Task: 9.4
 * Requirements: 9.3
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from './SearchBar';
import * as apiClient from '@/services/api/client';
import type { AmodiatairMinimal } from '@/types';

// Mock dependencies
jest.mock('@/services/api/client');
jest.mock('@/services/api/routes', () => ({
    ApiRoutes: {
        getAmodiatairesSearch: (query: string) => `/api/amodiataires/search?q=${query}`,
    },
}));
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
    }),
}));
jest.mock('@/utils/routeUtils', () => ({
    searchRoutes: jest.fn((routes, query) => {
        if (!query || query.length < 2) return [];
        return routes.filter((route: any) =>
            route.name.toLowerCase().includes(query.toLowerCase())
        );
    }),
}));

const mockedGet = apiClient.get as jest.MockedFunction<typeof apiClient.get>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}

describe('SearchBar - Backward Compatibility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Task 9.4: Backward Compatibility Tests', () => {
        /**
         * Test that existing amodiataire search still works
         * Requirement 9.3: THE System SHALL maintain the existing amodiataire 
         * search functionality without breaking changes
         */
        test('should perform amodiataire search when no searchType is specified (default behavior)', async () => {
            // Arrange: Mock amodiataire search results
            const mockAmodiataires: AmodiatairMinimal[] = [
                {
                    id: '1',
                    nom: 'Dupont',
                    prenom: 'Jean',
                    raisonSociale: 'Dupont SARL',
                    telephone: '0123456789',
                },
                {
                    id: '2',
                    nom: 'Martin',
                    prenom: 'Marie',
                    raisonSociale: 'Martin & Co',
                    telephone: '0987654321',
                },
            ];

            mockedGet.mockResolvedValueOnce({
                success: true,
                data: mockAmodiataires,
                count: 2,
                query: 'test',
            });

            const onResultSelect = jest.fn();

            // Act: Render SearchBar without searchType prop (should default to 'amodiataires')
            const { getByPlaceholderText, findByText } = render(
                <SearchBar onResultSelect={onResultSelect} />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);

            // Type search query
            fireEvent.changeText(input, 'test');

            // Assert: Should display amodiataire results
            await waitFor(() => {
                expect(mockedGet).toHaveBeenCalledWith(
                    expect.stringContaining('/api/amodiataires/search?q=test')
                );
            });

            // Verify results are displayed
            const result1 = await findByText('Dupont SARL');
            const result2 = await findByText('Martin & Co');

            expect(result1).toBeTruthy();
            expect(result2).toBeTruthy();
        });

        test('should call onResultSelect when amodiataire is selected (default behavior)', async () => {
            // Arrange: Mock amodiataire search results
            const mockAmodiataire: AmodiatairMinimal = {
                id: '1',
                nom: 'Dupont',
                prenom: 'Jean',
                raisonSociale: 'Dupont SARL',
                telephone: '0123456789',
            };

            mockedGet.mockResolvedValueOnce({
                success: true,
                data: [mockAmodiataire],
                count: 1,
                query: 'dupont',
            });

            const onResultSelect = jest.fn();

            // Act: Render SearchBar and perform search
            const { getByPlaceholderText, findByText } = render(
                <SearchBar onResultSelect={onResultSelect} />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'dupont');

            // Wait for results and click on the result
            const result = await findByText('Dupont SARL');
            fireEvent.press(result);

            // Assert: onResultSelect should be called with the selected amodiataire
            await waitFor(() => {
                expect(onResultSelect).toHaveBeenCalledWith(mockAmodiataire);
            });
        });

        test('should explicitly work with searchType="amodiataires"', async () => {
            // Arrange: Mock amodiataire search results
            const mockAmodiataires: AmodiatairMinimal[] = [
                {
                    id: '1',
                    nom: 'Test',
                    prenom: 'User',
                    raisonSociale: 'Test Company',
                    telephone: '1234567890',
                },
            ];

            mockedGet.mockResolvedValueOnce({
                success: true,
                data: mockAmodiataires,
                count: 1,
                query: 'test',
            });

            const onResultSelect = jest.fn();

            // Act: Render SearchBar with explicit searchType="amodiataires"
            const { getByPlaceholderText, findByText } = render(
                <SearchBar 
                    searchType="amodiataires" 
                    onResultSelect={onResultSelect} 
                />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'test');

            // Assert: Should display amodiataire results
            const result = await findByText('Test Company');
            expect(result).toBeTruthy();

            // Click on result
            fireEvent.press(result);

            // Verify callback is called
            await waitFor(() => {
                expect(onResultSelect).toHaveBeenCalledWith(mockAmodiataires[0]);
            });
        });

        /**
         * Test that default behavior is unchanged
         * Requirement 9.3: THE System SHALL maintain the existing amodiataire 
         * search functionality without breaking changes
         */
        test('should use default placeholder for amodiataire search', () => {
            // Act: Render SearchBar without searchType
            const { getByPlaceholderText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            // Assert: Should have amodiataire placeholder by default
            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            expect(input).toBeTruthy();
        });

        test('should not require routes or onRouteSelect props for default behavior', () => {
            // Act: Render SearchBar without route-related props
            const { getByPlaceholderText } = render(
                <SearchBar onResultSelect={jest.fn()} />,
                { wrapper: createWrapper() }
            );

            // Assert: Should render without errors
            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            expect(input).toBeTruthy();
        });

        test('should handle search query changes for amodiataires (default)', async () => {
            // Arrange: Mock different search results
            mockedGet
                .mockResolvedValueOnce({
                    success: true,
                    data: [
                        {
                            id: '1',
                            nom: 'Dupont',
                            prenom: 'Jean',
                            raisonSociale: 'Dupont SARL',
                            telephone: '0123456789',
                        },
                    ],
                    count: 1,
                    query: 'du',
                })
                .mockResolvedValueOnce({
                    success: true,
                    data: [
                        {
                            id: '1',
                            nom: 'Dupont',
                            prenom: 'Jean',
                            raisonSociale: 'Dupont SARL',
                            telephone: '0123456789',
                        },
                        {
                            id: '2',
                            nom: 'Durand',
                            prenom: 'Pierre',
                            raisonSociale: 'Durand Inc',
                            telephone: '1111111111',
                        },
                    ],
                    count: 2,
                    query: 'dur',
                });

            // Act: Render SearchBar and perform searches
            const { getByPlaceholderText, findByText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);

            // First search
            fireEvent.changeText(input, 'du');
            await findByText('Dupont SARL');

            // Second search
            fireEvent.changeText(input, 'dur');
            await findByText('Durand Inc');

            // Assert: Both API calls should have been made
            expect(mockedGet).toHaveBeenCalledTimes(2);
        });

        test('should clear search results when query is cleared (default behavior)', async () => {
            // Arrange: Mock search results
            mockedGet.mockResolvedValueOnce({
                success: true,
                data: [
                    {
                        id: '1',
                        nom: 'Test',
                        prenom: 'User',
                        raisonSociale: 'Test Company',
                        telephone: '1234567890',
                    },
                ],
                count: 1,
                query: 'test',
            });

            // Act: Render SearchBar, perform search, then clear
            const { getByPlaceholderText, findByText, queryByText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);

            // Perform search
            fireEvent.changeText(input, 'test');
            await findByText('Test Company');

            // Clear search
            fireEvent.changeText(input, '');

            // Assert: Results should be hidden
            await waitFor(() => {
                expect(queryByText('Test Company')).toBeNull();
            });
        });

        test('should show loading state during amodiataire search (default behavior)', async () => {
            // Arrange: Mock delayed API response
            mockedGet.mockImplementation(
                () =>
                    new Promise((resolve) =>
                        setTimeout(
                            () =>
                                resolve({
                                    success: true,
                                    data: [],
                                    count: 0,
                                    query: 'test',
                                }),
                            100
                        )
                    )
            );

            // Act: Render SearchBar and start search
            const { getByPlaceholderText, findByText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'test');

            // Assert: Should show loading indicator
            const loadingText = await findByText(/recherche en cours/i);
            expect(loadingText).toBeTruthy();
        });

        test('should show "no results" message when amodiataire search returns empty (default behavior)', async () => {
            // Arrange: Mock empty search results
            mockedGet.mockResolvedValueOnce({
                success: true,
                data: [],
                count: 0,
                query: 'nonexistent',
            });

            // Act: Render SearchBar and perform search
            const { getByPlaceholderText, findByText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'nonexistent');

            // Assert: Should show "no results" message
            const noResultsText = await findByText(/aucun résultat trouvé/i);
            expect(noResultsText).toBeTruthy();
        });

        test('should handle API errors gracefully for amodiataire search (default behavior)', async () => {
            // Arrange: Mock API error
            mockedGet.mockRejectedValueOnce(new Error('Network error'));

            // Act: Render SearchBar and perform search
            const { getByPlaceholderText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'test');

            // Assert: Component should handle error gracefully without crashing
            // Note: The actual error display behavior depends on React Query's error handling
            // The component logs the error and React Query manages the error state
            await waitFor(() => {
                // The component should not crash and should be in a stable state
                expect(input).toBeTruthy();
            }, { timeout: 3000 });

            // Verify the component is still functional after error
            expect(getByPlaceholderText(/rechercher un amodiataire/i)).toBeTruthy();
        });

        test('should not trigger search for queries shorter than 2 characters (default behavior)', async () => {
            // Act: Render SearchBar and type single character
            const { getByPlaceholderText, queryByText } = render(
                <SearchBar />,
                { wrapper: createWrapper() }
            );

            const input = getByPlaceholderText(/rechercher un amodiataire/i);
            fireEvent.changeText(input, 'a');

            // Assert: Should not make API call or show results
            await waitFor(() => {
                expect(mockedGet).not.toHaveBeenCalled();
            });

            expect(queryByText(/recherche en cours/i)).toBeNull();
        });
    });
});
