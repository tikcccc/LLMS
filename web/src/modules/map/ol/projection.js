import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import { get as getProjection } from "ol/proj";

export const EPSG_2326 = "EPSG:2326";

export function registerHK80() {
  proj4.defs(
    EPSG_2326,
    "+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +units=m +no_defs"
  );
  register(proj4);
  return getProjection(EPSG_2326);
}
