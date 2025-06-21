import * as Location from 'expo-location';
import { getDistance } from 'geolib';

export async function isWithinRadius(target, radius) {
  const loc = await Location.getCurrentPositionAsync({});
  const dist = getDistance(loc.coords, target);
  return dist <= radius;
}
