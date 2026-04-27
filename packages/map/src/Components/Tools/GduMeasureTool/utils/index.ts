export function getDistanceLabel(distance?: number) {
  const meters = (distance ?? 0) * 1000;
  if (meters < 1000) {
    return `${Number(meters.toFixed(2))}m`;
  }
  return `${Number((meters / 1000).toFixed(2))}km`;
}

export function getAreaLabel(area?: number) {
  const squareMeters = area ?? 0;
  if (squareMeters < 1000 * 1000) {
    return `${Number(squareMeters.toFixed(2))}㎡`;
  }
  return `${Number((squareMeters / 1000 / 1000).toFixed(5))}k㎡`;
}
