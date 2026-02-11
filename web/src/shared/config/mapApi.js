export const MAP_API_VERSION = "v1.0.0";
export const HK80_SRID = "HK80";

export const BASEMAP_URL = `https://mapapi.geodata.gov.hk/gs/api/${MAP_API_VERSION}/xyz/basemap/${HK80_SRID}/{z}/{x}/{y}.png`;
export const LABEL_URL = `https://mapapi.geodata.gov.hk/gs/api/${MAP_API_VERSION}/xyz/label/hk/en/${HK80_SRID}/{z}/{x}/{y}.png`;

export const MAP_MIN_ZOOM = 10;
export const MAP_MAX_ZOOM = 19;

export const INT_LAND_GEOJSON_URL = "/geojson/int-land.geojson";
export const SITE_BOUNDARY_GEOJSON_URL = "/data/site-boundaries.geojson";
