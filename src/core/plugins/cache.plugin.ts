/*
 * @Author       : 晓晓晓晓丶vv
 * @Date         : 2024-08-26 11:11:30
 * @LastEditTime : 2024-08-26 16:33:43
 * @LastEditors  : 晓晓晓晓丶vv
 * @Description  : 缓存链路插件
 */
import Localforage, { INDEXEDDB, WEBSQL, LOCALSTORAGE } from 'localforage';

import type { IPlugin, ITrackContext, TrackData } from '@/types';
import { CACHE_DB_NAME, CACHE_KEY, SESSION_ID_KEY } from '@/constant';
import { sortTrackDataBySeq } from '@/helper';

class CachePlugin implements IPlugin {
  name = 'CachePlugin';

  protected context?: ITrackContext;
  protected storage?: typeof Localforage;
  protected cacheTrack: TrackData[] = [];

  install(context: ITrackContext) {
    this.context = context;
    this.cacheTrack = [];
    this.initCache();
    this.context?.log(this.name, `${this.name} installed`);
  }

  uninstall() {
    this.storage = undefined;
    this.cacheTrack = [];
  }

  /**
   * @description: 初始化cache实例
   * @return {*}
   */
  protected initCache() {
    if (this.context?.options.enableCache) {
      // 初始化localforage 并且按照indexDB -> webSQL -> localstorage的优先级驱动
      this.storage = Localforage.createInstance({
        name: CACHE_DB_NAME,
        storeName: CACHE_KEY,
        driver: [INDEXEDDB, WEBSQL, LOCALSTORAGE],
      });
      // 将缓存对象注册到上下文
      this.context?.registerCache(this);
      // 不存在sessionId的情况下 清空原有的所有缓存数据
      // NOTE 这里不能通过上下文来获取sessionId 不然会存在时机问题
      const sessionId = window.sessionStorage.getItem(SESSION_ID_KEY);
      if (!sessionId) {
        this.storage.clear();
        this.context?.log('No SessionID', 'clear storage data');
        return;
      }
      this.getCacheTrack();
    }
  }

  /**
   * @description: 从缓存中读取链路数据
   * @return {*}
   */
  protected async getCacheTrack() {
    await this.storage?.iterate((value: TrackData) => {
      this.cacheTrack.push(value);
    });
    this.cacheTrack = sortTrackDataBySeq(this.cacheTrack);
    this.context?.overwriteTrackData(this.cacheTrack);
    this.context?.log('Get track data', this.context.trackData.slice(0));
  }

  protected createKey(track: TrackData) {
    const { actionSeq, action } = track;
    const orderSeq = actionSeq.toString().padStart(3, '0');
    return `${orderSeq}_${this.context?.sessionId}_${action}`;
  }

  /**
   * @description: 移除目标缓存
   * @param {string} key
   * @return {*}
   */
  async remove(track: TrackData) {
    if (!this.context?.options.enableCache) return;
    const cacheKey = this.createKey(track);
    await this.storage?.removeItem(cacheKey);
    this.context.log('Remove cache', cacheKey);
  }

  /**
   * @description: 设置缓存
   * @param {string} key
   * @param {TrackData} track
   * @return {*}
   */
  async set(track: TrackData) {
    if (!this.context?.options.enableCache) return;
    const cacheKey = this.createKey(track);
    await this.storage?.setItem(cacheKey, track);
    this.context.log('Set cache', cacheKey);
  }
}

const cachePlugin = new CachePlugin();

export { cachePlugin, CachePlugin };
