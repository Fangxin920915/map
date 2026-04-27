import * as utm from "utm";
import * as numeric from "numeric";
import { cloneDeep } from "lodash-es";
import { DataFilterImp } from "@gdu-gl/common";
// @ts-ignore
window.numeric = numeric;

export default class CoordinateKalmanFilter
  implements DataFilterImp<[number, number]>
{
  x: number[][];

  dt: number;

  F: number[][];

  H: number[][];

  base_sigma_pos: number;

  sigma_pos: number;

  Q: number[][];

  sigma_lon: number;

  sigma_lat: number;

  R: number[][];

  P: number[][];

  history: any[];

  max_history: number;

  last_valid_x: number[][];

  n: number;

  distance_threshold: number;

  consecutive_threshold: number;

  outlier_threshold: number;

  consecutive_small_count: number;

  private initialized: boolean;

  constructor(options?: {
    distance_threshold: number;
    consecutive_threshold: number;
    outlier_threshold: number;
  }) {
    this.x = [[0.0], [0.0]];
    this.dt = 1 / 30;
    this.F = [
      [1.0, this.dt],
      [0.0, 1.0],
    ];
    this.H = [
      [1.0, 0.0],
      [0.0, 1.0],
    ];
    this.base_sigma_pos = 0.01;
    this.sigma_pos = 0.01;
    this.Q = [
      [this.sigma_pos ** 2, 0.0],
      [0.0, this.sigma_pos ** 2],
    ];
    this.sigma_lon = 1e-5;
    this.sigma_lat = 1e-5;
    this.R = [
      [this.sigma_lon ** 2, 0.0],
      [0.0, this.sigma_lat ** 2],
    ];
    this.P = [
      [1, 0.0],
      [0.0, 1],
    ];
    this.history = [];
    this.max_history = 5;
    this.last_valid_x = [[0.0], [0.0]];
    this.n = 2;
    this.distance_threshold = options?.distance_threshold || 0.01;
    this.consecutive_threshold = options?.consecutive_threshold || 3;
    this.outlier_threshold = options?.outlier_threshold || 0.1;
    this.consecutive_small_count = 0;
    this.initialized = false;
  }

  init(measure: [number, number]) {
    this.x = [[measure[0]], [measure[1]]];
    this._update_history(measure);
    this.initialized = true;
  }

  _update_history(measure: [number, number]) {
    this.history.push(measure);
    if (this.history.length > this.max_history) {
      this.history.shift();
    }
  }

  _is_outer(measure: [number, number]): boolean {
    if (this.history.length < 2) return false;
    const current = utm.fromLatLon(measure[1], measure[0]);
    const histLats = this.history.map((item) => item[1]);
    const histLons = this.history.map((item) => item[0]);
    const avgLat = histLats.reduce((a, b) => a + b, 0) / histLats.length;
    const avgLon = histLons.reduce((a, b) => a + b, 0) / histLons.length;
    const last = utm.fromLatLon(avgLat, avgLon);
    const distance = Math.sqrt(
      (current.easting - last.easting) ** 2 +
        (current.northing - last.northing) ** 2,
    );
    return distance > this.outlier_threshold;
  }

  _adjust_noise(distance: number) {
    this.sigma_pos = this.base_sigma_pos * (1 + Math.min(distance, 5) / 5);
    this.Q = [
      [this.sigma_pos ** 2, 0.0],
      [0.0, this.sigma_pos ** 2],
    ];
  }

  predict() {
    if (!this.initialized) return;
    this.x = numeric.dot(this.F, this.x) as number[][];
    const FTranspose = numeric.transpose(this.F) as number[][];
    const FPFt = numeric.dot(
      numeric.dot(this.F, this.P),
      FTranspose,
    ) as number[][];
    this.P = numeric.add(FPFt, this.Q) as number[][];
  }

  update(measure: [number, number]) {
    if (!this.initialized) {
      this.init(measure);
      this.last_valid_x = cloneDeep(this.x);
      return this.x.flat(1);
    }
    const current = utm.fromLatLon(measure[1], measure[0]);
    const last = utm.fromLatLon(
      this.last_valid_x[1][0],
      this.last_valid_x[0][0],
    );
    const distance = Math.sqrt(
      (current.easting - last.easting) ** 2 +
        (current.northing - last.northing) ** 2,
    );
    this._adjust_noise(distance);
    let measureUse = [[measure[0]], [measure[1]]];

    if (distance > this.distance_threshold) {
      measureUse =
        this.consecutive_small_count >= this.consecutive_threshold
          ? this.last_valid_x
          : measureUse;
    } else {
      this.consecutive_small_count = 0;
      measureUse = [[measure[0]], [measure[1]]];
      this.last_valid_x = cloneDeep(measureUse);
    }
    const hDotX = numeric.dot(this.H, this.x) as number[][];
    const y = numeric.sub(measureUse, hDotX);

    const hTranspose = numeric.transpose(this.H) as number[][];
    const HPHt = numeric.dot(
      numeric.dot(this.H, this.P),
      hTranspose,
    ) as number[][];
    const S = numeric.add(HPHt, this.R);
    const PHt = numeric.dot(this.P, hTranspose) as number[][];
    const invS = numeric.inv(S);
    const K = numeric.dot(PHt, invS) as number[][];
    const kDotY = numeric.dot(K, y) as number[][];
    this.x = numeric.add(this.x, kDotY) as number[][];
    const I = [
      [1, 0],
      [0, 1],
    ];
    const KH = numeric.dot(K, this.H) as number[][];
    const IMinusKH = numeric.sub(I, KH) as number[][];
    this.P = numeric.dot(IMinusKH, this.P) as number[][];
    this.last_valid_x = cloneDeep(this.x);
    this._update_history(measure);
  }

  filter(measure: [number, number]): [number, number] {
    this.predict();
    this.update(measure);
    return this.x.flat(1) as [number, number];
  }
}
