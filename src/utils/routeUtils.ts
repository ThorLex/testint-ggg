/**
 * Route utility functions for map-routes-and-notifications feature
 * 
 * This module provides utilities for processing, validating, and styling
 * route data for display on the map.
 * 
 * @module utils/routeUtils
 */

import type { Route, RouteCoordinate } from '@/types';

/**
 * Sorts route coordinates by their order field
 * 
 * If coordinates lack an order field, uses the array index as fallback.
 * Maintains original array order for duplicate order values.
 * 
 * @param coordinates - Array of route coordinates to sort
 * @returns New array of coordinates sorted by order field
 */
export function sortRouteCoordinates(coordinates: RouteCoordinate[]): RouteCoordinate[] {
    return [...coordinates].sort((a, b) => {
        const orderA = a.order ?? coordinates.indexOf(a);
        const orderB = b.order ?? coordinates.indexOf(b);
        return orderA - orderB;
    });
}

/**
 * Validates that a coordinate has valid lat/lng values
 * 
 * Checks that:
 * - lat and lng are numbers
 * - lat is between -90 and 90
 * - lng is between -180 and 180
 * - Values are not NaN
 * 
 * @param coord - Coordinate to validate
 * @returns true if coordinate is valid, false otherwise
 */
export function isValidCoordinate(coord: RouteCoordinate): boolean {
    return (
        typeof coord.lat === 'number' &&
        typeof coord.lng === 'number' &&
        !isNaN(coord.lat) &&
        !isNaN(coord.lng) &&
        coord.lat >= -90 &&
        coord.lat <= 90 &&
        coord.lng >= -180 &&
        coord.lng <= 180
    );
}

/**
 * Filters and validates route coordinates
 * 
 * Removes invalid coordinates and sorts the remaining ones by order.
 * Returns empty array if fewer than 2 valid coordinates remain.
 * 
 * @param coordinates - Array of coordinates to validate
 * @returns Filtered and sorted array of valid coordinates, or empty array
 */
export function validateRouteCoordinates(coordinates: RouteCoordinate[]): RouteCoordinate[] {
    const valid = coordinates.filter(isValidCoordinate);
    
    if (valid.length < 2) {
        console.warn('Route has fewer than 2 valid coordinates');
        return [];
    }
    
    return sortRouteCoordinates(valid);
}

/**
 * Gets the style configuration for a route based on its status
 * 
 * Returns stroke color, width, and opacity based on:
 * - Route status (active, maintenance, inactive)
 * - Selection state (selected routes are wider and use different colors)
 * 
 * @param status - Route status
 * @param isSelected - Whether the route is currently selected
 * @returns Style object with strokeColor, strokeWidth, and opacity
 */
export function getRouteStyle(status: Route['status'], isSelected: boolean) {
    const baseStyle = {
        strokeWidth: isSelected ? 6 : 3,
    };
    
    switch (status) {
        case 'active':
            return {
                ...baseStyle,
                strokeColor: isSelected ? '#3B82F6' : '#10B981',
                opacity: 1,
            };
        case 'maintenance':
            return {
                ...baseStyle,
                strokeColor: isSelected ? '#F59E0B' : '#FCD34D',
                opacity: 0.7,
            };
        case 'inactive':
            return {
                ...baseStyle,
                strokeColor: isSelected ? '#6B7280' : '#9CA3AF',
                opacity: 0.5,
            };
        default:
            return {
                ...baseStyle,
                strokeColor: '#10B981',
                opacity: 1,
            };
    }
}

/**
 * Searches routes by name (case-insensitive, partial match)
 * 
 * Filters routes whose name contains the search query.
 * Returns all routes if query is empty or whitespace-only.
 * 
 * @param routes - Array of routes to search
 * @param query - Search query string
 * @returns Filtered array of routes matching the query
 */
export function searchRoutes(routes: Route[], query: string): Route[] {
    if (!query || query.trim().length === 0) {
        return routes;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    return routes.filter(route =>
        route.name.toLowerCase().includes(lowerQuery)
    );
}
