export const MAP_API_VERSION = "v1.0.0";
export const HK80_SRID = "HK80";

export const BASEMAP_URL = `https://mapapi.geodata.gov.hk/gs/api/${MAP_API_VERSION}/xyz/basemap/${HK80_SRID}/{z}/{x}/{y}.png`;
export const LABEL_URL = `https://mapapi.geodata.gov.hk/gs/api/${MAP_API_VERSION}/xyz/label/hk/en/${HK80_SRID}/{z}/{x}/{y}.png`;

export const MAP_MIN_ZOOM = 10;
export const MAP_MAX_ZOOM = 19;

export const INT_LAND_GEOJSON_URL = "/geojson/int-land.geojson";
export const INT_LAND_MIN_AREA = 200; // m², filter tiny slivers
export const INT_LAND_LABEL_MIN_AREA = 500; // m², show labels on larger polygons only
export const INT_LAND_LINE_MIN_LENGTH = 5; // m, drop tiny line fragments
