import { Geoid, parsePGM } from "@math.gl/geoid";
import { PointCoordinates } from "@common/Interfaces";
import { isValidCoordinates } from "@common/Utils";
import pgm from "./egm96-15.pgm?url";

/**
 * GeoidInstance 类用于管理大地水准面实例，采用单例模式，确保全局只有一个大地水准面实例。
 * 该类负责从指定 URL 加载 PGM 格式的大地水准面数据，并提供获取指定坐标大地水准面高度的方法。
 */
export class GeoidInstance {
  // 静态属性，用于存储 GeoidInstance 类的唯一实例
  private static _instance: GeoidInstance | null = null;

  // 私有属性，用于存储大地水准面实例
  private _geoid: Geoid | null = null;

  // 新增：静态属性，用于存储初始化 Promise
  private static _initPromise: Promise<GeoidInstance> | null = null;

  // 只读私有属性，用于存储 PGM 文件的 URL
  private readonly _url: string;

  /**
   * 私有构造函数，防止外部直接实例化该类。
   * @param url - PGM 文件的 URL，用于加载大地水准面数据。
   */
  private constructor(url: string) {
    this._url = url;
  }

  /**
   * 静态异步方法，用于获取 GeoidInstance 类的唯一实例。
   * 如果实例不存在或传入的 URL 与现有实例的 URL 不同，则创建新实例并初始化。
   * @returns 一个 Promise，解析为 GeoidInstance 类的唯一实例。
   */
  public static async getInstance(): Promise<GeoidInstance> {
    if (this._instance) {
      return this._instance;
    }
    // 如果初始化 Promise 已经存在，直接返回
    if (this._initPromise) {
      return this._initPromise;
    }

    // 创建新的初始化 Promise
    this._initPromise = (async () => {
      const instance = new GeoidInstance(pgm);
      // 等待实例初始化完成
      await instance.init();
      // 更新静态实例
      this._instance = instance;
      // 初始化完成后，重置 initPromise
      this._initPromise = null;
      return this._instance;
    })();

    return this._initPromise;
  }

  /**
   * 静态方法，用于销毁 GeoidInstance 类的唯一实例，释放相关资源。
   */
  public static destroy() {
    // 检查实例是否存在
    if (this._instance) {
      // 清空大地水准面实例
      this._instance._geoid = null;
      // 清空静态实例
      this._instance = null;
    }
  }

  /**
   * 私有异步方法，用于初始化大地水准面实例。
   * 该方法会检查 PGM 文件的 URL 是否配置，若配置则通过 fetch 请求获取 PGM 文件，
   * 并将响应内容转换为 ArrayBuffer，再进一步转换为 Uint8Array 格式，
   * 最后使用 parsePGM 函数解析数据并赋值给 _geoid 属性。
   * @throws {Error} 若 PGM 文件的 URL 未配置，抛出错误提示海拔数据地址未配置。
   */
  private async init() {
    // 检查 PGM 文件的 URL 是否为空
    if (!this._url) {
      // 若为空，抛出错误提示海拔数据地址未配置
      throw new Error("海拔数据地址未配置，请检查**.pgm配置文件");
    }
    // 发起 HTTP 请求获取 PGM 文件
    const response = await fetch(this._url);
    // 将响应内容转换为 ArrayBuffer
    const buffer = await response.arrayBuffer();
    // 将 ArrayBuffer 转换为 Uint8Array
    const unit8Array = new Uint8Array(buffer);
    // 使用 parsePGM 函数解析 Uint8Array 数据并赋值给 _geoid 属性
    this._geoid = parsePGM(unit8Array, {});
  }

  /**
   * 公共方法，用于获取指定坐标的大地水准面高度。
   * 该方法会先检查大地水准面实例是否已初始化，若未初始化则抛出错误；
   * 接着使用 isValidCoordinates 函数验证并处理传入的坐标，
   * 最后调用大地水准面实例的 getHeight 方法获取高度。
   * @param coordinates - 待获取大地水准面高度的坐标，类型为 PointCoordinates。
   * @returns 指定坐标的大地水准面高度。
   * @throws {Error} 若大地水准面实例未初始化，抛出错误提示 Geoid 未初始化。
   */
  public static getHeight(coordinates: PointCoordinates) {
    // 检查大地水准面实例是否未初始化
    if (!this._instance?._geoid) {
      // 若未初始化，抛出错误提示 Geoid 未初始化
      throw new Error("Geoid 未初始化");
    }
    // 使用 isValidCoordinates 函数验证并处理传入的坐标
    const [lon, lat] = isValidCoordinates(coordinates);
    // 调用大地水准面实例的 getHeight 方法获取指定坐标的大地水准面高度
    return this._instance?._geoid.getHeight(lat, lon);
  }
}
