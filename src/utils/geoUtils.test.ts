import { calculateInternalRoute, createHybridRoute, findBoundaryIntersection } from './geoUtils';
import { Route } from '@/types';

describe('geoUtils - boundary intersection', () => {
    const squarePolygon = [
        { lat: 0, lng: 0 },
        { lat: 0, lng: 10 },
        { lat: 10, lng: 10 },
        { lat: 10, lng: 0 }
    ];

    it('should find intersection between point outside and point inside', () => {
        const pOutside = { latitude: 5, longitude: -5 };
        const pInside = { latitude: 5, longitude: 5 };
        
        const intersection = findBoundaryIntersection(pOutside, pInside, squarePolygon);
        
        expect(intersection).not.toBeNull();
        expect(intersection!.latitude).toBeCloseTo(5);
        expect(intersection!.longitude).toBeCloseTo(0);
    });

    it('should return null when both points are outside', () => {
        const p1 = { latitude: 5, longitude: -10 };
        const p2 = { latitude: 5, longitude: -5 };
        const intersection = findBoundaryIntersection(p1, p2, squarePolygon);
        expect(intersection).toBeNull();
    });
});

describe('geoUtils - createHybridRoute (Restored Dijkstra)', () => {
    const mockBackendRoutes: Route[] = [
        {
            id: 'route-1',
            coordinates: [
                { lat: 8, lng: 10.5, order: 0 },
                { lat: 10, lng: 10.5, order: 1 },
                { lat: 12, lng: 10.5, order: 2 },
            ]
        } as any
    ];
    const zoneBounds = [
        { lat: 9, lng: 9 },
        { lat: 9, lng: 12 },
        { lat: 12, lng: 12 },
        { lat: 12, lng: 9 }
    ];

    it('should perform surgical truncation at the edge (Vertical)', () => {
        const googlePoints = [
            { latitude: 5, longitude: 10.5 }, // Outside (South)
            { latitude: 11, longitude: 10.5 }   // Inside
        ];
        const origin = googlePoints[0];
        const destination = { lat: 11, lng: 10.5 };
        
        const segments = createHybridRoute(googlePoints, mockBackendRoutes, origin, destination, zoneBounds);
        
        expect(segments.length).toBe(2);
        expect(segments[0].type).toBe('google');
        expect(segments[1].type).toBe('backend');
        
        // Junction point should be at lat 9 (intersection with bottom edge)
        const junctionPoint = segments[0].points[segments[0].points.length - 1];
        expect(junctionPoint.latitude).toBeCloseTo(9);
        expect(junctionPoint.longitude).toBe(10.5);
    });

    it('should perform surgical truncation at the edge (Horizontal)', () => {
        const googlePoints = [
            { latitude: 10.5, longitude: 5 }, // Outside (West)
            { latitude: 10.5, longitude: 11 }   // Inside
        ];
        const origin = googlePoints[0];
        const destination = { lat: 10.5, lng: 11 };
        
        const segments = createHybridRoute(googlePoints, mockBackendRoutes, origin, destination, zoneBounds);
        
        expect(segments.length).toBe(2);
        const junctionPoint = segments[0].points[segments[0].points.length - 1];
        expect(junctionPoint.longitude).toBeCloseTo(9); // Intersection with West edge
        expect(junctionPoint.latitude).toBe(10.5);
    });
});
