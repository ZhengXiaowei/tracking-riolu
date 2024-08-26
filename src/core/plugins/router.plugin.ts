/*
 * @Author       : 晓晓晓晓丶vv
 * @Date         : 2024-08-23 16:25:08
 * @LastEditTime : 2024-08-26 15:16:33
 * @LastEditors  : 晓晓晓晓丶vv
 * @Description  : 监听路由变化
 */

import type { IPlugin, IRouterTrack, ITrackContext } from '@/types';

class RouterPlugin implements IPlugin {
  name = 'RouterPlugin';

  protected context?: ITrackContext;
  protected observer: MutationObserver | null = null; // dom监听器
  protected currentUri = ''; // 当前路由
  protected stayTiming = 0; // 用户在每个页面停留的时间

  install(context: ITrackContext) {
    this.context = context;
    this.currentUri = window.location.href;
    this.stayTiming = new Date().valueOf();
    this.initRouterListener();
    this.context?.log(this.name, `${this.name} installed`);
  }

  uninstall() {
    this.observer?.disconnect();
  }

  /**
   * @description: 路由变化时做下记录
   * @return {*}
   */
  protected initRouterListener() {
    // NOTE 利用mutationObserver监听dom变化的特性结合location来判断路由是否变化
    this.observer = new MutationObserver(() => {
      const listenerUri = window.location.href;

      if (this.currentUri !== listenerUri) {
        this.context?.log(
          'Route change',
          `Route change from ${this.currentUri} to ${listenerUri}`,
        );

        // 增加track节点
        this.addTrackWhenRouterChange(listenerUri);
      }
    });
    this.observer.observe(window.document, { subtree: true, childList: true });
  }

  /**
   * @description: 路由变化就做记录
   * @param {string} currentUri
   * @return {*}
   */
  protected addTrackWhenRouterChange(currentUri: string) {
    // 增加track节点
    this.context?.addTrackChain({
      action: 'Jump',
      fromUri: this.currentUri,
      currentUri,
      prevStayTiming: `${this.calcStayTiming()}ms`,
    } as IRouterTrack);
    this.context?.log('Add tracking', this.context?.trackData.slice(0));
    // 将目标路由替换为当前路由
    this.currentUri = currentUri;
    // 重新记录时间
    this.stayTiming = new Date().valueOf();
  }

  /**
   * @description: 计算页面停留时间
   * @return {*}
   */
  protected calcStayTiming() {
    const diffStayTiming = new Date().valueOf() - this.stayTiming;
    return diffStayTiming;
  }
}

const routerPlugin = new RouterPlugin();

export { routerPlugin, RouterPlugin };
