/**
 * Tests for property-based test generators
 * 
 * Verifies that all generators produce valid data structures.
 * 
 * Feature: map-routes-and-notifications
 */

import * as fc from 'fast-check';
import {
    routeCoordinateArbitrary,
    routeMetadataArbitrary,
    routeArbitrary,
    announcementArbitrary,
    invalidRouteCoordinateArbitrary,
    minimalRouteArbitrary,
    maximalRouteArbitrary,
    routeArrayArbitrary,
    announcementArrayArbitrary,
} from './generators';

describe('Test Generators', () => {
    describe('routeCoordinateArbitrary', () => {
        test('should generate valid RouteCoordinate objects', () => {
            fc.assert(
                fc.property(routeCoordinateArbitrary, (coord) => {
                    expect(coord).toHaveProperty('lat');
                    expect(coord).toHaveProperty('lng');
                    expect(coord).toHaveProperty('order');
                    expect(typeof coord.lat).toBe('number');
                    expect(typeof coord.lng).toBe('number');
                    expect(typeof coord.order).toBe('number');
                    expect(coord.lat).toBeGreaterThanOrEqual(-90);
                    expect(coord.lat).toBeLessThanOrEqual(90);
                    expect(coord.lng).toBeGreaterThanOrEqual(-180);
                    expect(coord.lng).toBeLessThanOrEqual(180);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('routeMetadataArbitrary', () => {
        test('should generate valid RouteMetadata objects', () => {
            fc.assert(
                fc.property(routeMetadataArbitrary, (metadata) => {
                    expect(metadata).toHaveProperty('roadType');
                    expect(metadata).toHaveProperty('maxSpeed');
                    expect(metadata).toHaveProperty('width');
                    expect(metadata).toHaveProperty('surface');
                    expect(['highway', 'street', 'boulevard', 'avenue', 'road']).toContain(metadata.roadType);
                    expect(metadata.maxSpeed).toBeGreaterThanOrEqual(10);
                    expect(metadata.maxSpeed).toBeLessThanOrEqual(130);
                    expect(metadata.width).toBeGreaterThanOrEqual(2);
                    expect(metadata.width).toBeLessThanOrEqual(20);
                    expect(['asphalt', 'concrete', 'gravel', 'dirt']).toContain(metadata.surface);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('routeArbitrary', () => {
        test('should generate valid Route objects', () => {
            fc.assert(
                fc.property(routeArbitrary, (route) => {
                    expect(route).toHaveProperty('id');
                    expect(route).toHaveProperty('name');
                    expect(route).toHaveProperty('coordinates');
                    expect(route).toHaveProperty('status');
                    expect(route).toHaveProperty('metadata');
                    expect(typeof route.id).toBe('string');
                    expect(typeof route.name).toBe('string');
                    expect(Array.isArray(route.coordinates)).toBe(true);
                    expect(route.coordinates.length).toBeGreaterThanOrEqual(2);
                    expect(route.coordinates.length).toBeLessThanOrEqual(20);
                    expect(['active', 'inactive', 'maintenance']).toContain(route.status);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('announcementArbitrary', () => {
        test('should generate valid Announcement objects', () => {
            fc.assert(
                fc.property(announcementArbitrary, (announcement) => {
                    expect(announcement).toHaveProperty('id');
                    expect(announcement).toHaveProperty('title');
                    expect(announcement).toHaveProperty('type');
                    expect(announcement).toHaveProperty('content');
                    expect(typeof announcement.id).toBe('string');
                    expect(typeof announcement.title).toBe('string');
                    expect(typeof announcement.type).toBe('string');
                    expect(typeof announcement.content).toBe('string');
                    expect(announcement.title.length).toBeGreaterThanOrEqual(5);
                    expect(announcement.title.length).toBeLessThanOrEqual(100);
                    expect(announcement.content.length).toBeGreaterThanOrEqual(10);
                    expect(announcement.content.length).toBeLessThanOrEqual(500);
                    expect(['info', 'warning', 'alert', 'maintenance']).toContain(announcement.type);
                    
                    if (announcement.date !== null && announcement.date !== undefined) {
                        expect(typeof announcement.date).toBe('string');
                    }
                    
                    if (announcement.priority !== null && announcement.priority !== undefined) {
                        expect(['low', 'medium', 'high']).toContain(announcement.priority);
                    }
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('invalidRouteCoordinateArbitrary', () => {
        test('should generate invalid RouteCoordinate objects', () => {
            fc.assert(
                fc.property(invalidRouteCoordinateArbitrary, (coord) => {
                    // At least one of lat or lng should be out of valid range
                    const latValid = coord.lat >= -90 && coord.lat <= 90;
                    const lngValid = coord.lng >= -180 && coord.lng <= 180;
                    expect(latValid && lngValid).toBe(false);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('minimalRouteArbitrary', () => {
        test('should generate Route objects with exactly 2 coordinates', () => {
            fc.assert(
                fc.property(minimalRouteArbitrary, (route) => {
                    expect(route.coordinates.length).toBe(2);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('maximalRouteArbitrary', () => {
        test('should generate Route objects with exactly 20 coordinates', () => {
            fc.assert(
                fc.property(maximalRouteArbitrary, (route) => {
                    expect(route.coordinates.length).toBe(20);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('routeArrayArbitrary', () => {
        test('should generate arrays of Route objects with default size', () => {
            fc.assert(
                fc.property(routeArrayArbitrary(), (routes) => {
                    expect(Array.isArray(routes)).toBe(true);
                    expect(routes.length).toBeGreaterThanOrEqual(1);
                    expect(routes.length).toBeLessThanOrEqual(20);
                }),
                { numRuns: 100 }
            );
        });

        test('should generate arrays of Route objects with custom size', () => {
            fc.assert(
                fc.property(routeArrayArbitrary(5, 10), (routes) => {
                    expect(Array.isArray(routes)).toBe(true);
                    expect(routes.length).toBeGreaterThanOrEqual(5);
                    expect(routes.length).toBeLessThanOrEqual(10);
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('announcementArrayArbitrary', () => {
        test('should generate arrays of Announcement objects with default size', () => {
            fc.assert(
                fc.property(announcementArrayArbitrary(), (announcements) => {
                    expect(Array.isArray(announcements)).toBe(true);
                    expect(announcements.length).toBeGreaterThanOrEqual(1);
                    expect(announcements.length).toBeLessThanOrEqual(20);
                }),
                { numRuns: 100 }
            );
        });

        test('should generate arrays of Announcement objects with custom size', () => {
            fc.assert(
                fc.property(announcementArrayArbitrary(3, 7), (announcements) => {
                    expect(Array.isArray(announcements)).toBe(true);
                    expect(announcements.length).toBeGreaterThanOrEqual(3);
                    expect(announcements.length).toBeLessThanOrEqual(7);
                }),
                { numRuns: 100 }
            );
        });
    });
});
