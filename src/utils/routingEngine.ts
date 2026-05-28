import { Route, RouteCoordinate } from '@/types';
import { calculateDistance, distanceToSegment, findNearestPointOnSegment } from './geoUtils';

export interface Node {
    id: string;
    lat: number;
    lng: number;
}

export interface Edge {
    from: string;
    to: string;
    weight: number;
    points: { latitude: number; longitude: number }[];
    originalRouteId: string;
}

export interface SnappedPoint {
    point: { latitude: number; longitude: number };
    nodeA: string;
    nodeB: string;
    distA: number;
    distB: number;
    edge: Edge;
}

export interface PathSegment {
    points: { latitude: number; longitude: number }[];
    routeId: string;
}

/**
 * Moteur de calcul d'itinéraire interne basé sur Dijkstra
 */
export class RoutingEngine {
    public nodes: Map<string, Node> = new Map();
    private adjacencyList: Map<string, Edge[]> = new Map();

    constructor(routes: Route[]) {
        this.buildGraph(routes);
    }

    private buildGraph(routes: Route[]) {
        const JOIN_THRESHOLD = 5; // 5 mètres pour joindre deux noeuds

        routes.forEach(route => {
            if (!route.coordinates || route.coordinates.length < 2) return;
            const sortedCoords = [...route.coordinates].sort((a, b) => a.order - b.order);

            for (let i = 0; i < sortedCoords.length - 1; i++) {
                const p1 = sortedCoords[i];
                const p2 = sortedCoords[i + 1];

                const key1 = this.getOrCreateNode(p1.lat, p1.lng, JOIN_THRESHOLD);
                const key2 = this.getOrCreateNode(p2.lat, p2.lng, JOIN_THRESHOLD);

                const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
                this.addEdge(key1, key2, dist, [{ latitude: p1.lat, longitude: p1.lng }, { latitude: p2.lat, longitude: p2.lng }], route.id);
                this.addEdge(key2, key1, dist, [{ latitude: p2.lat, longitude: p2.lng }, { latitude: p1.lat, longitude: p1.lng }], route.id);
            }
        });
    }

    private getOrCreateNode(lat: number, lng: number, threshold: number): string {
        // Chercher un noeud existant à proximité
        let nearestNode: Node | null = null;
        let minDistance = Infinity;

        this.nodes.forEach(node => {
            const dist = calculateDistance(lat, lng, node.lat, node.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearestNode = node;
            }
        });

        if (nearestNode && minDistance <= threshold) {
            return (nearestNode as Node).id;
        }

        // Créer un nouveau noeud
        const id = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        this.nodes.set(id, { id, lat, lng });
        return id;
    }

    private addEdge(from: string, to: string, weight: number, points: { latitude: number; longitude: number }[], routeId: string) {
        if (!this.adjacencyList.has(from)) this.adjacencyList.set(from, []);
        this.adjacencyList.get(from)!.push({ from, to, weight, points, originalRouteId: routeId });
    }

    public snapToEdge(lat: number, lng: number): SnappedPoint | null {
        let nearestSnapped: SnappedPoint | null = null;
        let minDistance = Infinity;
        const p = { latitude: lat, longitude: lng };

        this.adjacencyList.forEach((edges) => {
            edges.forEach(edge => {
                for (let i = 0; i < edge.points.length - 1; i++) {
                    const p1 = edge.points[i];
                    const p2 = edge.points[i + 1];
                    const dist = distanceToSegment(p, p1, p2);
                    if (dist < minDistance) {
                        minDistance = dist;
                        const nearestPoint = findNearestPointOnSegment(p, p1, p2);
                        const nodeA = this.nodes.get(edge.from)!;
                        const nodeB = this.nodes.get(edge.to)!;
                        nearestSnapped = {
                            point: nearestPoint,
                            nodeA: edge.from,
                            nodeB: edge.to,
                            distA: calculateDistance(nearestPoint.latitude, nearestPoint.longitude, nodeA.lat, nodeA.lng),
                            distB: calculateDistance(nearestPoint.latitude, nearestPoint.longitude, nodeB.lat, nodeB.lng),
                            edge
                        };
                    }
                }
            });
        });
        return nearestSnapped;
    }

    public findPath(startLat: number, startLng: number, endLat: number, endLng: number): { 
        segments: PathSegment[];
        distance: number;
    } | null {
        const startSnap = this.snapToEdge(startLat, startLng);
        const endSnap = this.snapToEdge(endLat, endLng);
        if (!startSnap || !endSnap) return null;

        const possibleStarts = [{ id: startSnap.nodeA, dist: startSnap.distA }, { id: startSnap.nodeB, dist: startSnap.distB }];
        const possibleEnds = [{ id: endSnap.nodeA, dist: endSnap.distA }, { id: endSnap.nodeB, dist: endSnap.distB }];

        let bestResult: { segments: PathSegment[], distance: number } | null = null;

        for (const s of possibleStarts) {
            for (const e of possibleEnds) {
                const dijkstraResult = this.dijkstra(s.id, e.id);
                if (dijkstraResult) {
                    const totalDist = s.dist + dijkstraResult.distance + e.dist;
                    
                    if (!bestResult || totalDist < bestResult.distance) {
                        const allSegments: PathSegment[] = [];

                        // 1. Segment de départ (snap)
                        allSegments.push({
                            points: [startSnap.point, { latitude: this.nodes.get(s.id)!.lat, longitude: this.nodes.get(s.id)!.lng }],
                            routeId: startSnap.edge.originalRouteId
                        });

                        // 2. Segments de Dijkstra
                        dijkstraResult.segments.forEach(seg => {
                            const lastSeg = allSegments[allSegments.length - 1];
                            if (lastSeg && lastSeg.routeId === seg.routeId) {
                                lastSeg.points.push(...seg.points.slice(1));
                            } else {
                                allSegments.push(seg);
                            }
                        });

                        // 3. Segment de fin (snap)
                        const lastSeg = allSegments[allSegments.length - 1];
                        const endPoint = endSnap.point;
                        if (lastSeg && lastSeg.routeId === endSnap.edge.originalRouteId) {
                            lastSeg.points.push(endPoint);
                        } else {
                            allSegments.push({
                                points: [{ latitude: this.nodes.get(e.id)!.lat, longitude: this.nodes.get(e.id)!.lng }, endPoint],
                                routeId: endSnap.edge.originalRouteId
                            });
                        }

                        bestResult = { segments: allSegments, distance: totalDist };
                    }
                }
            }
        }
        
        // Cas particulier : sur la même arête
        if (startSnap.edge.from === endSnap.edge.from && startSnap.edge.to === endSnap.edge.to) {
            const directDist = calculateDistance(startSnap.point.latitude, startSnap.point.longitude, endSnap.point.latitude, endSnap.point.longitude);
            if (!bestResult || directDist < bestResult.distance) {
                bestResult = { 
                    segments: [{
                        points: [startSnap.point, endSnap.point],
                        routeId: startSnap.edge.originalRouteId
                    }],
                    distance: directDist
                };
            }
        }

        return bestResult;
    }

    private dijkstra(startNodeId: string, endNodeId: string): { segments: PathSegment[], distance: number } | null {
        if (startNodeId === endNodeId) return { segments: [], distance: 0 };
        const distances = new Map<string, number>();
        const previous = new Map<string, Edge | null>();
        const nodes = new Set<string>();

        this.nodes.forEach(node => {
            distances.set(node.id, node.id === startNodeId ? 0 : Infinity);
            nodes.add(node.id);
        });

        while (nodes.size > 0) {
            let closestNodeId: string | null = null;
            nodes.forEach(id => {
                if (distances.get(id) !== Infinity && (closestNodeId === null || distances.get(id)! < distances.get(closestNodeId)!)) {
                    closestNodeId = id;
                }
            });
            if (!closestNodeId || distances.get(closestNodeId) === Infinity) break;
            if (closestNodeId === endNodeId) break;
            nodes.delete(closestNodeId);

            const neighbors = this.adjacencyList.get(closestNodeId) || [];
            for (const edge of neighbors) {
                if (!nodes.has(edge.to)) continue;
                const alt = distances.get(closestNodeId)! + edge.weight;
                if (alt < distances.get(edge.to)!) {
                    distances.set(edge.to, alt);
                    previous.set(edge.to, edge);
                }
            }
        }

        if (!previous.has(endNodeId)) return null;

        const pathSegments: PathSegment[] = [];
        let cur = endNodeId;
        
        while(previous.has(cur)) {
            const edge = previous.get(cur)!;
            const points = [...edge.points].reverse();
            
            if (pathSegments.length > 0 && pathSegments[0].routeId === edge.originalRouteId) {
                pathSegments[0].points.unshift(...points.slice(0, -1));
            } else {
                pathSegments.unshift({
                    points: points,
                    routeId: edge.originalRouteId
                });
            }
            cur = edge.from;
        }

        return { 
            segments: pathSegments,
            distance: distances.get(endNodeId)!
        };
    }
}
