import { v4 as uuidv4 } from "uuid";

/**
 * 生成 uuid
 * @returns string
 */
export function uuid(): string {
  return uuidv4();
}
export function radiansToDegrees(radians: number): number {
  // 弧度转角度公式：角度 = 弧度 × (180 / π)
  return radians * (180 / Math.PI);
}
