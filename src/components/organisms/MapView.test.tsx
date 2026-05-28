/**
 * Unit tests for MapView component error handling
 * 
 * Tests specific error scenarios for API request failures, malformed data, and network timeouts.
 * 
 * Feature: map-routes-and-notifications
 */

import { render, fireEvent } from '@testing-library/react-native';
import { GeoMap } from './MapView';
import { useMapData } from '@/hooks/useApi';
import { useMapStore } from '@/store';

// Mock dependencies
jest.mock('@/hooks/useApi');
jest.mock('@/store');
jest.mock('@/services/location', () => ({
    getCurrentLocation: jest.fn().mockResolvedValue(null),
}));
jest.mock('@tanstack/react-query', () => ({
    useQuery: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
    })),
}));
jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, fallback?: string) => fallback || key,
    }),
}));

// ============================================================================
// Test Setup
// ============================================================================

const mockUseMapStore = useMapStore as jest.MockedFunction<typeof useMapStore>;
const mockUseMapData = useMapData as jest.MockedFunction<typeof useMapData>;

beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseMapStore.mockReturnValue({
        region: {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
        },
        setRegion: jest.fn(),
        markers: [],
        setMarkers: jest.fn(),
        selectedMarkerId: null,
        setSelectedMarkerId: jest.fn(),
        isFollowingUser: false,
        showsUserLocation: true,
        showsZoneBounds: false,
    } as any);

    // Default: no error, no loading
    mockUseMapData.mockReturnValue({
        data: {
            buildings: [],
            amodiatairBuildings: [],
            routes: [],
            announcements: [],
        },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
    } as any);

    const mockUseQuery = require('@tanstack/react-query').useQuery;
    mockUseQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
    });
});

// ============================================================================
// Unit Tests - Error Scenarios
// ============================================================================

describe('MapView - Error Handling', () => {
    /**
     * **Validates: Requirements 11.2**
     * 
     * Test API request failure handling
     */
    test('should display error message when API request fails', () => {
        const mockRefetch = jest.fn();
        
        // Setup: API request failed
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network request failed'),
            refetch: mockRefetch,
        } as any);

        const { getByText } = render(<GeoMap />);

        // Verify error message is displayed
        expect(getByText(/erreur/i)).toBeTruthy();
        
        // Verify retry button is present
        expect(getByText(/réessayer/i)).toBeTruthy();
    });

    /**
     * **Validates: Requirements 11.3**
     * 
     * Test malformed data handling
     */
    test('should display error message when data is malformed', () => {
        const mockRefetch = jest.fn();
        
        // Setup: Malformed data error
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('JSON parse error: Unexpected token'),
            refetch: mockRefetch,
        } as any);

        const { getByText, getAllByText } = render(<GeoMap />);

        // Verify error message is displayed
        expect(getByText(/données invalides/i)).toBeTruthy();
        expect(getByText(/données reçues sont incorrectes/i)).toBeTruthy();
        
        // Verify retry button is present (may appear multiple times)
        expect(getAllByText(/réessayer/i).length).toBeGreaterThan(0);
    });

    /**
     * **Validates: Requirements 11.5**
     * 
     * Test network timeout handling
     */
    test('should display timeout error message when request times out', () => {
        const mockRefetch = jest.fn();
        
        // Setup: Timeout error
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Request timeout: ETIMEDOUT'),
            refetch: mockRefetch,
        } as any);

        const { getByText, getAllByText } = render(<GeoMap />);

        // Verify timeout-specific error message is displayed
        expect(getByText(/délai d'attente dépassé/i)).toBeTruthy();
        expect(getByText(/connexion a pris trop de temps/i)).toBeTruthy();
        
        // Verify retry button is present (may appear multiple times)
        expect(getAllByText(/réessayer/i).length).toBeGreaterThan(0);
    });

    test('should handle network error with ERR_NETWORK code', () => {
        const mockRefetch = jest.fn();
        
        // Setup: Network error with code
        const networkError = new Error('Network Error');
        (networkError as any).code = 'ERR_NETWORK';
        
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: networkError,
            refetch: mockRefetch,
        } as any);

        const { getByText } = render(<GeoMap />);

        // Verify network error message is displayed
        expect(getByText(/erreur réseau/i)).toBeTruthy();
        expect(getByText(/impossible de se connecter au serveur/i)).toBeTruthy();
    });

    test('should call refetch when retry button is pressed', () => {
        const mockRefetch = jest.fn();
        const mockAmodiatairesRefetch = jest.fn();
        const mockZoneBoundsRefetch = jest.fn();
        
        // Setup: Error state
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Network error'),
            refetch: mockRefetch,
        } as any);

        const mockUseQuery = require('@tanstack/react-query').useQuery;
        mockUseQuery
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
                refetch: mockAmodiatairesRefetch,
            })
            .mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: null,
                refetch: mockZoneBoundsRefetch,
            });

        const { getByText } = render(<GeoMap />);

        // Press retry button
        const retryButton = getByText(/réessayer/i);
        fireEvent.press(retryButton);

        // Verify all refetch functions were called
        expect(mockRefetch).toHaveBeenCalledTimes(1);
        expect(mockAmodiatairesRefetch).toHaveBeenCalledTimes(1);
        expect(mockZoneBoundsRefetch).toHaveBeenCalledTimes(1);
    });

    test('should display generic error message for unknown errors', () => {
        const mockRefetch = jest.fn();
        
        // Setup: Unknown error
        mockUseMapData.mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Something went wrong'),
            refetch: mockRefetch,
        } as any);

        const { getByText } = render(<GeoMap />);

        // Verify generic error message is displayed
        expect(getByText(/erreur de chargement/i)).toBeTruthy();
        expect(getByText(/une erreur est survenue/i)).toBeTruthy();
    });
});
