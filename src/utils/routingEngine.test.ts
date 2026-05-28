import { RoutingEngine } from './routingEngine';
import { Route } from '@/types';

describe('RoutingEngine - Road Following', () => {
    const mockRoutes: Route[] = [
        {
            id: 'curved-route',
            coordinates: [
                { lat: 0, lng: 0, order: 0 },
                { lat: 1, lng: 1, order: 1 }, // Intermediate point (curve)
                { lat: 2, lng: 2, order: 2 },
            ]
        } as any
    ];

    it('should include intermediate points in the polyline', () => {
        const engine = new RoutingEngine(mockRoutes);
        const path = engine.findPath(0, 0, 2, 2);

        expect(path).not.toBeNull();
        // Should contain (0,0), (1,1), and (2,2)
        expect(path!.polyline.length).toBe(3);
        expect(path!.polyline[0]).toEqual({ latitude: 0, longitude: 0 });
        expect(path!.polyline[1]).toEqual({ latitude: 1, longitude: 1 });
        expect(path!.polyline[2]).toEqual({ latitude: 2, longitude: 2 });
    });

    it('should correctly link points at junctions (precison check)', () => {
        const network: Route[] = [
            {
                id: 'r1',
                coordinates: [{ lat: 0, lng: 0, order: 0 }, { lat: 1, lng: 1, order: 1 }]
            } as any,
            {
                id: 'r2',
                coordinates: [{ lat: 1, lng: 1, order: 0 }, { lat: 2, lng: 2, order: 1 }]
            } as any
        ];
        const engine = new RoutingEngine(network);
        const path = engine.findPath(0, 0, 2, 2);
        
        expect(path).not.toBeNull();
        // Path should be (0,0) -> (1,1) -> (2,2)
        expect(path!.polyline.length).toBe(3);
    });
});
