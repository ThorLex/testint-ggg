import { Coordinates, Route, PolygonCoordinate } from '@/types';
import { RoutingEngine } from './routingEngine';

export interface PolylineSegment {
    points: { latitude: number; longitude: number }[];
    type: 'google' | 'backend' | 'internal';
    name?: string;
    routeIds?: string[];
}

/**
 * Vérifie si un point est à l'intérieur d'un polygone
 */
export function isPointInPolygon(point: { lat: number; lng: number }, polygon: PolygonCoordinate[]): boolean {
    if (!polygon || polygon.length < 3) return false;
    
    let isInside = false;
    const x = point.lng;
    const y = point.lat;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng, yi = polygon[i].lat;
        const xj = polygon[j].lng, yj = polygon[j].lat;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            
        if (intersect) isInside = !isInside;
    }
    
    return isInside;
}

/**
 * Calcule la distance entre deux points (Haversine)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Trouve le point le plus proche sur une route backend
 */
export function findNearestRoute(point: { lat: number; lng: number }, routes: Route[]): { route: Route; distance: number; pointIndex: number } | null {
    if (!routes || routes.length === 0) return null;
    
    let nearest = null;
    let minDistance = Infinity;

    for (const route of routes) {
        if (!route.coordinates) continue;
        
        for (let i = 0; i < route.coordinates.length; i++) {
            const coord = route.coordinates[i];
            const dist = calculateDistance(point.lat, point.lng, coord.lat, coord.lng);
            if (dist < minDistance) {
                minDistance = dist;
                nearest = { route, distance: dist, pointIndex: i };
            }
        }
    }
    
    return nearest;
}

/**
 * Décoder une polyline encodée de Google
 */
export function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
    const points: { latitude: number; longitude: number }[] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
}

/**
 * Trouve le point d'entrée idéal dans le réseau backend pour une destination donnée,
 * en tenant compte de la position de départ (origine).
 */
export function findBestBackendEntrance(
    destination: { lat: number; lng: number },
    backendRoutes: Route[],
    origin?: { latitude: number; longitude: number }
): { route: Route; entrancePoint: { latitude: number; longitude: number } } | null {
    if (!backendRoutes || backendRoutes.length === 0) return null;

    // 1. Trouver la route la plus proche de la destination
    const nearest = findNearestRoute(destination, backendRoutes);
    if (!nearest) return null;

    // 2. Trouver le point sur CETTE route qui est le plus proche de l'origine
    // Cela évite de faire rouler Google jusqu'à l'autre bout de la route
    const sortedCoords = [...nearest.route.coordinates].sort((a, b) => a.order - b.order);
    
    let entrance = sortedCoords[0]; // Par défaut le début
    
    if (origin) {
        let minOriginDist = Infinity;
        sortedCoords.forEach(coord => {
            const dist = calculateDistance(origin.latitude, origin.longitude, coord.lat, coord.lng);
            if (dist < minOriginDist) {
                minOriginDist = dist;
                entrance = coord;
            }
        });
    }

    return {
        route: nearest.route,
        entrancePoint: { latitude: entrance.lat, longitude: entrance.lng }
    };
}

/**
 * Calcule le point le plus proche sur un segment (P1-P2) à partir d'un point P
 */
export function findNearestPointOnSegment(
    p: { latitude: number, longitude: number },
    p1: { latitude: number, longitude: number },
    p2: { latitude: number, longitude: number }
): { latitude: number, longitude: number } {
    const x = p.longitude, y = p.latitude;
    const x1 = p1.longitude, y1 = p1.latitude;
    const x2 = p2.longitude, y2 = p2.latitude;

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) return p1;

    // t is the projection parameter (between 0 and 1)
    let t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    return {
        latitude: y1 + t * dy,
        longitude: x1 + t * dx
    };
}

/**
 * Calcule la distance (orthodromique approximée ou euclidienne pour petites distances) 
 * d'un point à un segment
 */
export function distanceToSegment(
    p: { latitude: number, longitude: number },
    p1: { latitude: number, longitude: number },
    p2: { latitude: number, longitude: number }
): number {
    const nearest = findNearestPointOnSegment(p, p1, p2);
    return calculateDistance(p.latitude, p.longitude, nearest.latitude, nearest.longitude);
}

/**
 * Raccourcit un chemin (tableau de points) à la fin d'une certaine distance (en mètres)
 */
export function shortenPathAtEnd(
    points: { latitude: number; longitude: number }[],
    distanceMeters: number
): { latitude: number; longitude: number }[] {
    if (points.length < 2) return points;

    const last = points[points.length - 1];
    const secondLast = points[points.length - 2];

    const dist = calculateDistance(secondLast.latitude, secondLast.longitude, last.latitude, last.longitude);

    if (dist <= distanceMeters) {
        // Le segment est trop court, on retire le dernier point et on continue récursivement
        const remainingPoints = points.slice(0, -1);
        return shortenPathAtEnd(remainingPoints, distanceMeters - dist);
    }

    // Calcul du point intermédiaire
    const ratio = (dist - distanceMeters) / dist;
    const newLast = {
        latitude: secondLast.latitude + (last.latitude - secondLast.latitude) * ratio,
        longitude: secondLast.longitude + (last.longitude - secondLast.longitude) * ratio
    };

    return [...points.slice(0, -1), newLast];
}

/**
 * Trouve le point d'intersection entre un segment [P1, P2] et les bords d'un polygone.
 * Retourne le point d'intersection le plus proche de P1 si trouvé, sinon null.
 */
export function findBoundaryIntersection(
    p1: { latitude: number; longitude: number },
    p2: { latitude: number; longitude: number },
    polygon: PolygonCoordinate[]
): { latitude: number; longitude: number } | null {
    if (!polygon || polygon.length < 3) return null;

    let closestIntersection: { latitude: number; longitude: number } | null = null;
    let minDistance = Infinity;

    for (let i = 0; i < polygon.length; i++) {
        const a = { latitude: polygon[i].lat, longitude: polygon[i].lng };
        const b = { 
            latitude: polygon[(i + 1) % polygon.length].lat, 
            longitude: polygon[(i + 1) % polygon.length].lng 
        };

        const intersect = intersectSegments(p1, p2, a, b);
        if (intersect) {
            const dist = calculateDistance(p1.latitude, p1.longitude, intersect.latitude, intersect.longitude);
            if (dist < minDistance) {
                minDistance = dist;
                closestIntersection = intersect;
            }
        }
    }

    return closestIntersection;
}

/**
 * Calcul d'intersection entre deux segments (AB) et (CD)
 */
function intersectSegments(
    a: { latitude: number; longitude: number },
    b: { latitude: number; longitude: number },
    c: { latitude: number; longitude: number },
    d: { latitude: number; longitude: number }
): { latitude: number; longitude: number } | null {
    const x1 = a.longitude, y1 = a.latitude;
    const x2 = b.longitude, y2 = b.latitude;
    const x3 = c.longitude, y3 = c.latitude;
    const x4 = d.longitude, y4 = d.latitude;

    const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denominator === 0) return null;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return {
            latitude: y1 + ua * (y2 - y1),
            longitude: x1 + ua * (x2 - x1)
        };
    }

    return null;
}

/**
 * Calcule un itinéraire 100% interne (Dijkstra avec snap-to-edge)
 */
export function calculateInternalRoute(
    origin: { latitude: number; longitude: number },
    destination: { lat: number; lng: number },
    backendRoutes: Route[]
): PolylineSegment[] | null {
    if (!backendRoutes || backendRoutes.length === 0) return null;

    const engine = new RoutingEngine(backendRoutes);
    const result = engine.findPath(
        origin.latitude, origin.longitude,
        destination.lat, destination.lng
    );

    if (result && result.segments.length > 0) {
        return result.segments.map(seg => ({
            points: seg.points,
            type: 'backend',
            name: backendRoutes.find(r => r.id === seg.routeId)?.name || 'Réseau Interne',
            routeIds: [seg.routeId]
        }));
    }

    return null;
}

/**
 * Version améliorée pour la création de route hybride avec Support multi-segments et Transition de Proximité
 * Évite le "vol d'oiseau" en trouvant le point le plus proche entre les deux réseaux.
 */
export function createHybridRoute(
    googlePoints: { latitude: number; longitude: number }[],
    backendRoutes: Route[],
    origin: { latitude: number; longitude: number },
    destination: { lat: number; lng: number },
    zoneBounds?: PolygonCoordinate[]
): PolylineSegment[] {
    if (!backendRoutes || backendRoutes.length === 0) {
        return [{ points: googlePoints, type: 'google' }];
    }

    const isInZone = zoneBounds ? isPointInPolygon(destination, zoneBounds) : true;
    
    if (isInZone) {
        const engine = new RoutingEngine(backendRoutes);

        // 1. Trajet 100% interne si l'origine est aussi dans la zone
        const isOriginInZone = zoneBounds ? isPointInPolygon({ lat: origin.latitude, lng: origin.longitude }, zoneBounds) : false;
        
        if (isOriginInZone) {
            const internalResult = engine.findPath(origin.latitude, origin.longitude, destination.lat, destination.lng);
            if (internalResult && internalResult.segments.length > 0) {
                return internalResult.segments.map(seg => ({
                    points: seg.points,
                    type: 'backend',
                    name: backendRoutes.find(r => r.id === seg.routeId)?.name || 'Réseau Interne',
                    routeIds: [seg.routeId]
                }));
            }
        }

        // 2. Recherche du meilleur point de jonction par proximité (vrai suivi de route)
        // On cherche le point sur la route Google qui est le plus proche du réseau backend
        let bestJunctionIndex = -1;
        let minNetworkDistance = Infinity;
        let bestSnappedPoint: { latitude: number; longitude: number } | null = null;
        
        const NEARBY_THRESHOLD = 30; // On cherche une jonction dans un rayon de 30m

        for (let i = 0; i < googlePoints.length; i++) {
            const gp = googlePoints[i];
            const snap = engine.snapToEdge(gp.latitude, gp.longitude);
            
            if (snap) {
                const dist = calculateDistance(gp.latitude, gp.longitude, snap.point.latitude, snap.point.longitude);
                
                // Critères de sélection :
                // 1. On favorise les points très proches du réseau (< 10m)
                // 2. Si plusieurs points sont proches, on garde celui qui est le plus loin dans le tracé Google 
                //    (pour laisser Google nous emmener au plus près possible à l'intérieur de la zone)
                if (dist < 10) {
                    // Si on était déjà sur un point très proche, on met à jour SEULEMENT si l'index est plus grand
                    if (minNetworkDistance < 10) {
                        if (i > bestJunctionIndex) {
                            bestJunctionIndex = i;
                            bestSnappedPoint = snap.point;
                            minNetworkDistance = dist;
                        }
                    } else {
                        bestJunctionIndex = i;
                        bestSnappedPoint = snap.point;
                        minNetworkDistance = dist;
                    }
                } 
                // Si on a pas de point à moins de 10m, on garde le meilleur candidat sous le seuil global
                else if (dist < NEARBY_THRESHOLD && dist < minNetworkDistance) {
                    minNetworkDistance = dist;
                    bestJunctionIndex = i;
                    bestSnappedPoint = snap.point;
                }
            }
        }

        if (bestJunctionIndex !== -1 && bestSnappedPoint) {
            const junctionPoint = googlePoints[bestJunctionIndex];
            const internalResult = engine.findPath(junctionPoint.latitude, junctionPoint.longitude, destination.lat, destination.lng);
            
            if (internalResult && internalResult.segments.length > 0) {
                const truncatedGoogle = googlePoints.slice(0, bestJunctionIndex + 1);
                
                const backendSegments: PolylineSegment[] = internalResult.segments.map((seg, idx) => {
                    let points = seg.points;
                    // Assurer la jonction sans saut : on part du point Google exact
                    if (idx === 0) {
                        points = [junctionPoint, ...seg.points.slice(1)];
                    }
                    if (idx === internalResult.segments.length - 1) {
                        points = shortenPathAtEnd(points, 2.0);
                    }

                    return {
                        points,
                        type: 'backend' as const,
                        name: backendRoutes.find(r => r.id === seg.routeId)?.name || 'Navigation Portuaire',
                        routeIds: [seg.routeId]
                    };
                });
                
                return [
                    { points: truncatedGoogle, type: 'google' },
                    ...backendSegments
                ];
            }
        }
    }

    return [{ points: googlePoints, type: 'google' }];
}

/**
 * Calcule les métriques globales d'un itinéraire hybride
 */
export function calculateRouteMetrics(
    segments: PolylineSegment[],
    googleTotalDistance?: number,
    googleTotalDuration?: number
): { distance: number; duration: number } {
    let totalDistance = 0;
    let totalDuration = 0;

    // Vitesse moyenne supposée pour le réseau interne (20 km/h = 5.55 m/s)
    const INTERNAL_SPEED_MPS = 20 / 3.6;

    for (const segment of segments) {
        let segmentDistance = 0;
        for (let i = 0; i < segment.points.length - 1; i++) {
            segmentDistance += calculateDistance(
                segment.points[i].latitude,
                segment.points[i].longitude,
                segment.points[i + 1].latitude,
                segment.points[i + 1].longitude
            );
        }
        totalDistance += segmentDistance;

        if (segment.type === 'google' && googleTotalDistance && googleTotalDuration) {
            // Pour Google, on estime la durée au prorata de la distance parcourue sur ce segment
            // par rapport à la distance totale Google initiale
            const ratio = segmentDistance / googleTotalDistance;
            totalDuration += googleTotalDuration * ratio;
        } else {
            // Pour le réseau interne ou si pas d'infos Google, on utilise la vitesse interne
            totalDuration += segmentDistance / INTERNAL_SPEED_MPS;
        }
    }

    return { 
        distance: totalDistance, 
        duration: Math.round(totalDuration) 
    };
}

/**
 * Formate une distance (mètres -> km ou m)
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formate une durée (secondes -> min ou h/min)
 */
export function formatDuration(seconds: number): string {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} h`;
    return `${hours} h ${remainingMinutes} min`;
}
