/*
 * @Author       : 晓晓晓晓丶vv
 * @Date         : 2024-08-23 16:44:11
 * @LastEditTime : 2024-08-26 15:16:01
 * @LastEditors  : 晓晓晓晓丶vv
 * @Description  : 监听元素交互
 */

import type { IElementTrack, IPlugin, ITrackContext } from '@/types';

class ElementPlugin implements IPlugin {
  name = 'ElementPlugin';

  protected context?: ITrackContext;

  install(context: ITrackContext) {
    this.context = context;
    this.initElementListener();
    this.context?.log(this.name, `${this.name} installed`);
  }

  uninstall() {
    window.removeEventListener('click', this.addElementTrack.bind(this), true);
  }

  /**
   * @description: 监听元素文档流被点击的事件
   * @return {*}
   */
  protected initElementListener() {
    window.addEventListener('click', this.addElementTrack.bind(this), true);
  }

  /**
   * @description: 增加元素被点击的追踪
   * @param {Event} event
   * @return {*}
   */
  protected addElementTrack(event: Event) {
    const element = event.target as HTMLElement;
    this.context?.addTrackChain({
      action: 'Click',
      currentUri: window.location.href,
      element: element?.tagName ?? null,
      text: element?.innerText ?? null,
      classes: element?.className ?? null,
      triggerTiming: new Date().valueOf(),
    } as IElementTrack);
    this.context?.log('Click element', this.context?.trackData.slice(0));
  }
}

const elementPlugin = new ElementPlugin();

export { elementPlugin, ElementPlugin };
