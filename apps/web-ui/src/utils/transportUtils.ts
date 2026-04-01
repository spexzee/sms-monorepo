export const fetchRoadRoute = async (
    stops: { longitude: number; latitude: number }[],
    origin?: { longitude: number; latitude: number }
): Promise<[number, number][]> => {
    if (stops.length < 1 && !origin) return [];
    if (stops.length === 0 && origin) return [[origin.longitude, origin.latitude]];

    const allPoints = origin ? [origin, ...stops] : stops;
    if (allPoints.length < 2) return allPoints.map(p => [p.longitude, p.latitude]);

    try {
        const coordinates = allPoints.map(p => p.longitude + ',' + p.latitude).join(';');
        const url = 'https://router.project-osrm.org/route/v1/driving/' + coordinates + '?overview=full&geometries=geojson';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch route');
        
        const data = await response.json();
        if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) {
            return stops.map(s => [s.longitude, s.latitude]);
        }
        
        return data.routes[0].geometry.coordinates;
    } catch (error) {
        console.error('Routing Error:', error);
        return stops.map(s => [s.longitude, s.latitude]);
    }
};
