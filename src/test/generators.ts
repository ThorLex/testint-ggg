/**
 * Property-based test generators (arbitraries) for fast-check
 * 
 * This module provides reusable generators for creating test data
 * for property-based testing with fast-check.
 * 
 * Feature: map-routes-and-notifications
 * 
 * @module test/generators
 */

import * as fc from 'fast-check';
import type { Route, RouteCoordinate, RouteMetadata, Announcement } from '@/types';

// ============================================================================
// Route-related Arbitraries
// ============================================================================

/**
 * Generator for RouteCoordinate objects
 * 
 * Generates valid coordinate points with:
 * - lat: latitude between -90 and 90
 * - lng: longitude between -180 and 180
 * - order: integer between 0 and 1000
 */
export const routeCoordinateArbitrary = fc.record({
    lat: fc.float({ min: -90, max: 90, noNaN: true }),
    lng: fc.float({ min: -180, max: 180, noNaN: true }),
    order: fc.integer({ min: 0, max: 1000 }),
}) as fc.Arbitrary<RouteCoordinate>;

/**
 * Generator for RouteMetadata objects
 * 
 * Generates route metadata with:
 * - roadType: one of highway, street, boulevard, avenue, road
 * - maxSpeed: integer between 10 and 130 km/h
 * - width: float between 2 and 20 meters
 * - surface: one of asphalt, concrete, gravel, dirt
 */
export const routeMetadataArbitrary = fc.record({
    roadType: fc.constantFrom('highway', 'street', 'boulevard', 'avenue', 'road'),
    maxSpeed: fc.integer({ min: 10, max: 130 }),
    width: fc.float({ min: 2, max: 20, noNaN: true }),
    surface: fc.constantFrom('asphalt', 'concrete', 'gravel', 'dirt'),
}) as fc.Arbitrary<RouteMetadata>;

/**
 * Generator for Route objects
 * 
 * Generates complete route objects with:
 * - id: UUID
 * - name: non-empty string between 5 and 50 characters
 * - coordinates: array of 2-20 RouteCoordinate objects
 * - status: one of active, inactive, maintenance
 * - metadata: RouteMetadata object
 */
export const routeArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 20 }),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

// ============================================================================
// Announcement-related Arbitraries
// ============================================================================

/**
 * Generator for Announcement objects
 * 
 * Generates announcement/notification objects with:
 * - id: UUID
 * - title: string between 5 and 100 characters
 * - message: string between 10 and 500 characters
 * - shortMessage: string between 5 and 100 characters
 * - type: one of nouvelle_route, maintenance, alerte, info
 * - priority: one of basse, normale, haute
 * - status: one of brouillon, publiee, archivee
 * - targetAudience: string
 * - startDate: ISO date string
 * - endDate: optional ISO date string
 * - createdAt: ISO date string
 * - publishedAt: optional ISO date string
 * - metadata: object with imageUrl, attachments, contactInfo, actionRequired, actionUrl
 */
export const announcementArbitrary = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 5, maxLength: 100 }),
    message: fc.string({ minLength: 10, maxLength: 500 }),
    shortMessage: fc.string({ minLength: 5, maxLength: 100 }),
    type: fc.constantFrom('nouvelle_route', 'maintenance', 'alerte', 'info'),
    priority: fc.constantFrom('basse', 'normale', 'haute'),
    status: fc.constantFrom('brouillon', 'publiee', 'archivee'),
    targetAudience: fc.constantFrom('tous', 'amodiataires', 'admin'),
    startDate: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
        .map(timestamp => new Date(timestamp).toISOString()),
    endDate: fc.option(
        fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
            .map(timestamp => new Date(timestamp).toISOString())
    ),
    createdAt: fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
        .map(timestamp => new Date(timestamp).toISOString()),
    publishedAt: fc.option(
        fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
            .map(timestamp => new Date(timestamp).toISOString())
    ),
    metadata: fc.record({
        imageUrl: fc.option(fc.webUrl()),
        attachments: fc.array(fc.string(), { maxLength: 5 }),
        contactInfo: fc.option(fc.string()),
        actionRequired: fc.boolean(),
        actionUrl: fc.option(fc.webUrl()),
    }),
}) as fc.Arbitrary<Announcement>;

// ============================================================================
// Specialized Arbitraries
// ============================================================================

/**
 * Generator for invalid RouteCoordinate objects (for validation testing)
 * 
 * Generates coordinates with invalid lat/lng values:
 * - lat outside -90 to 90 range
 * - lng outside -180 to 180 range
 * - NaN values
 */
export const invalidRouteCoordinateArbitrary = fc.oneof(
    // Invalid latitude (> 90)
    fc.record({
        lat: fc.float({ min: Math.fround(90.00001), max: 200, noNaN: true }),
        lng: fc.float({ min: -180, max: 180, noNaN: true }),
        order: fc.integer(),
    }),
    // Invalid latitude (< -90)
    fc.record({
        lat: fc.float({ min: -200, max: Math.fround(-90.00001), noNaN: true }),
        lng: fc.float({ min: -180, max: 180, noNaN: true }),
        order: fc.integer(),
    }),
    // Invalid longitude (> 180)
    fc.record({
        lat: fc.float({ min: -90, max: 90, noNaN: true }),
        lng: fc.float({ min: Math.fround(180.00001), max: 360, noNaN: true }),
        order: fc.integer(),
    }),
    // Invalid longitude (< -180)
    fc.record({
        lat: fc.float({ min: -90, max: 90, noNaN: true }),
        lng: fc.float({ min: -360, max: Math.fround(-180.00001), noNaN: true }),
        order: fc.integer(),
    })
) as fc.Arbitrary<RouteCoordinate>;

/**
 * Generator for Route objects with minimum coordinates (2)
 */
export const minimalRouteArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(routeCoordinateArbitrary, { minLength: 2, maxLength: 2 }),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

/**
 * Generator for Route objects with maximum coordinates (20)
 */
export const maximalRouteArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
    coordinates: fc.array(routeCoordinateArbitrary, { minLength: 20, maxLength: 20 }),
    status: fc.constantFrom('active', 'inactive', 'maintenance'),
    metadata: routeMetadataArbitrary,
}) as fc.Arbitrary<Route>;

/**
 * Generator for arrays of Route objects
 * 
 * @param minLength - Minimum number of routes (default: 1)
 * @param maxLength - Maximum number of routes (default: 20)
 */
export const routeArrayArbitrary = (minLength = 1, maxLength = 20) =>
    fc.array(routeArbitrary, { minLength, maxLength });

/**
 * Generator for arrays of Announcement objects
 * 
 * @param minLength - Minimum number of announcements (default: 1)
 * @param maxLength - Maximum number of announcements (default: 20)
 */
export const announcementArrayArbitrary = (minLength = 1, maxLength = 20) =>
    fc.array(announcementArbitrary, { minLength, maxLength });
