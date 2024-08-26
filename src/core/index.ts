/*
 * @Author       : 晓晓晓晓丶vv
 * @Date         : 2024-08-21 18:36:00
 * @LastEditTime : 2024-08-26 16:41:08
 * @LastEditors  : 晓晓晓晓丶vv
 * @Description  : 链路追踪实例
 */
import { v4 as uuidV4 } from 'uuid';

import {
  routerPlugin,
  elementPlugin,
  errorPlugin,
  cachePlugin,
  CachePlugin,
} from '@/core/plugins';
import { ITrackOptions, TrackData, IPlugin, ITrackContext } from '@/types';

import { reactive } from './reactive';
import { SESSION_ID_KEY } from '@/constant';
import { onDocumentLoaded } from '@/helper';

class RioluTracking {
  protected cache?: CachePlugin; // 缓存对象
  protected session: Storage | null = null; // window session对象

  protected _sessionId = ''; // 当前会话下的id 后续可以通过该ID以及UserID配合查询
  protected clientId = ''; // 用户id
  protected context: ITrackContext | null = null; // 上下文信息

  private plugins: Map<string, IPlugin> = new Map(); // 插件集合

  // 默认的配置
  protected defaultOptions: ITrackOptions = {
    log: false,
    maxActions: 20,
    trackResources: false,
    trackErrors: ['script', 'promise'],
    enableCache: true,
  };

  protected _trackingData: TrackData[] = [];

  get trackingData() {
    return this._trackingData;
  }

  get sessionId() {
    return this._sessionId;
  }

  /**
   * @description: 初始化
   * @return {*}
   */
  async initialize(options?: Partial<ITrackOptions>) {
    // 等待dom加载结束后进行初始化
    await onDocumentLoaded();
    Object.assign(this.defaultOptions, options ?? {});
    // 创建上下文
    this.context = this.createContext();
    // 注册插件
    // NOTE 这个cache很纠结是以插件形式注入还是单独类实现
    // 看后续使用再进行调整吧
    this.use(cachePlugin).use(routerPlugin).use(elementPlugin).use(errorPlugin);
    this.unmounte();

    this.log('Tracking init', this.defaultOptions);
    // 生成当前会话的唯一ID
    this.initSessionId();
    this.log('Create sessionId', this.sessionId);

    if (!this._trackingData.length) {
      this.addTrackChain({
        action: 'Init',
        actionSeq: 0,
        currentUri: window.location.href,
      });
    }
  }

  /**
   * @description: 卸载所有插件
   * @return {*}
   */
  protected unmounte() {
    window.addEventListener(
      'beforeunload',
      () => {
        this.plugins.forEach(plugin => {
          try {
            plugin.uninstall();
            this.log(plugin.name, `${plugin.name} unmounted`);
          } catch (error) {
            console.error(`Error uninstalling plugin "${plugin.name}":`, error);
          }
        });
        this.plugins.clear();
      },
      false,
    );
  }

  /**
   * @description: 初始化sessionId
   * @return {*}
   */
  protected initSessionId() {
    this.session = window.sessionStorage;
    const sessionKey = this.session.getItem(SESSION_ID_KEY);
    if (sessionKey) {
      this._sessionId = sessionKey;
      this.setContext('sessionId', this._sessionId);
      return;
    }
    this._sessionId = uuidV4();
    this.setContext('sessionId', this._sessionId);
    this.session.setItem(SESSION_ID_KEY, this.sessionId);
  }

  /**
   * @description: 创建插件使用的上下文信息
   * @return {*}
   */
  protected createContext(): ITrackContext {
    return reactive({
      options: this.defaultOptions,
      trackData: this.trackingData,
      sessionId: this.sessionId,
      addTrackChain: this.addTrackChain.bind(this),
      uploadTrackChain: this.uploadTrackChain.bind(this),
      overwriteTrackData: this.overwriteTrackData.bind(this),
      log: this.log.bind(this),
      registerCache: cache => (this.cache = cache),
    });
  }

  /**
   * @description: 覆盖追踪数据
   * @param {TrackData} data
   * @return {*}
   */
  protected overwriteTrackData(tracks: TrackData[]) {
    this._trackingData = tracks.slice(0);
    this.setContext('trackData', this._trackingData);
  }

  /**
   * @description: 插件日志记录
   * @param {string} step 关键步骤
   * @param {string} message 步骤对应的信息
   * @return {*}
   */
  protected log(step: string, message: unknown) {
    if (this.defaultOptions.log) {
      console.info(`[${step}]: `, message);
    }
  }

  protected setContext<K extends keyof ITrackContext>(
    key: K,
    value: ITrackContext[K],
  ): void {
    if (this.context) this.context[key] = value;
  }

  /**
   * @description: 设置用户ID
   * @param {string} id
   * @return {*}
   */
  setClientId(id: string) {
    this.clientId = id;
  }

  /**
   * @description: 添加追踪链
   * @param {TrackData} track
   * @return {*}
   */
  addTrackChain(track: TrackData) {
    // 达到上限，移除首位追踪链
    if (this._trackingData.length >= this.defaultOptions.maxActions) {
      const firstTrack = this._trackingData.shift();
      firstTrack && this.cache?.remove(firstTrack);
    }
    // 获取到最后一个action的逻辑顺序
    const seq = this._trackingData.slice(0).pop()?.actionSeq ?? 0;
    track.actionSeq = seq + 1;
    this.cache?.set(track);
    this._trackingData.push(track);
    this.setContext('trackData', this._trackingData);
  }

  uploadTrackChain() {}

  /**
   * @description: 注册插件
   * @param {IPlugin} plugin 插件
   * @return {*}
   */
  use(plugin: IPlugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered.`);
      return this;
    }

    // 注册上下文信息
    plugin.install(this.context!);

    this.plugins.set(plugin.name, plugin);
    this.log('Add plugin', `Add plugin [${plugin.name}] success.`);
    return this;
  }

  /**
   * @description: 创建一个实例
   * @return {*} RioluTracking
   */
  static createInstance() {
    return new RioluTracking();
  }
}

/* ---------------------------------- 创建单例 ---------------------------------- */
const instance = RioluTracking.createInstance();

export default instance;
