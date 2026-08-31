import polylineCodec from "@googlemaps/polyline-codec";

/**
 * Decodes an encoded Google Polyline string to an array of [longitude, latitude] coordinates.
 * @param {string} encoded - Encoded polyline string
 * @returns {Array<Array<number>>} Array of coordinates
 */
export function decodePolyline(encoded) {
  if (!encoded) return [];
  const decoded = polylineCodec.decode(encoded);
  // Convert [latitude, longitude] to [longitude, latitude] for GeoJSON alignment
  return decoded.map(([lat, lng]) => [lng, lat]);
}
