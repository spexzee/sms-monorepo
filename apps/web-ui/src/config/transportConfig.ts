/**
 * Default school location used as the origin for all bus routes.
 * Values should be updated from the School Location Settings in the UI.
 */
export const DEFAULT_SCHOOL_LOCATION = {
    latitude: 28.6139,
    longitude: 77.2090,
    name: 'School Central'
};

export const getSchoolOrigin = (schoolData?: any) => {
    if (schoolData?.location?.latitude && schoolData?.location?.longitude) {
        return {
            latitude: schoolData.location.latitude,
            longitude: schoolData.location.longitude,
            name: 'School'
        };
    }
    return null;
};
