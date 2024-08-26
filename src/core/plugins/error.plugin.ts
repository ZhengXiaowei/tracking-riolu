/*
 * @Author       : 晓晓晓晓丶vv
 * @Date         : 2024-08-23 15:42:40
 * @LastEditTime : 2024-08-26 15:20:31
 * @LastEditors  : 晓晓晓晓丶vv
 * @Description  : 声明一个错误收集插件
 */

import { transformPromiseError } from '@/helper';
import type { IErrorTrack, IPlugin, ITrackContext } from '@/types';

class ErrorPlugin implements IPlugin {
  name = 'ErrorPlugin';

  protected context?: ITrackContext;

  install(context: ITrackContext) {
    this.context = context;
    // 监听错误收集
    this.initErrEvent();
    this.context?.log(this.name, `${this.name} installed`);
  }

  uninstall() {
    window.removeEventListener(
      'error',
      this.addNormalErrTrack.bind(this),
      true,
    );
    // 当离开页面的时候停止监听
    window.removeEventListener(
      'unhandledrejection',
      this.addPromiseErrTrack.bind(this),
      true,
    );

    window.onerror = null;
  }

  /**
   * @description: 初始化错误事件捕获
   * @return {*}
   */
  initErrEvent() {
    // 需要收集的错误类型
    const trackErrors = this.context?.options?.trackErrors ?? [
      'script',
      'resource',
      'promise',
    ];

    trackErrors.includes('resource') &&
      window.addEventListener('error', this.addNormalErrTrack.bind(this), true);

    trackErrors.includes('script') &&
      (window.onerror = this.addScriptErrTrack.bind(this));

    trackErrors.includes('promise') &&
      window.addEventListener(
        'unhandledrejection',
        this.addPromiseErrTrack.bind(this),
        true,
      );
  }

  /**
   * @description: 添加错误事件的数据链路
   * @param {Omit} trackData
   * @param {*} action
   * @return {*}
   */
  protected createErrorTrack(
    trackData: Omit<IErrorTrack, 'action' | 'actionSeq'>,
  ) {
    this.context?.addTrackChain({
      action: 'ERROR',
      actionSeq: 0, // 这个0在这里没实际意义 addTrackChain会重整这个序列
      ...trackData,
    });
    this.context?.log('Add error', this.context?.trackData.slice(0));
    this.context?.uploadTrackChain();
  }

  /**
   * @description: 常规脚本错误
   * @return {*}
   */
  protected addScriptErrTrack(
    event: Event | string,
    source?: string,
    lineno?: number,
    colno?: number,
    error?: Error,
  ) {
    if (event === 'Script error.' && !source) return false;

    colno =
      colno || (window.event && (window.event as any).errorCharacter) || 0;

    const name = source ? source.substr(source.lastIndexOf('/') + 1) : 'script';
    const errorInfo: Omit<IErrorTrack, 'action' | 'actionSeq'> = {
      errorType: 'script error',
      currentUri: window.location.href,
      message: event?.toString(),
      stackInfo: error?.stack ?? '',
      otherMessage: `${name} with lineno: ${lineno}`,
    };
    this.createErrorTrack(errorInfo);
    return true;
  }

  /**
   * @description: 添加 promise 错误
   * @param {any} event
   * @return {*}
   */
  protected addPromiseErrTrack(event: any) {
    const errorMsg = transformPromiseError(event.reason);
    const errorInfo: Omit<IErrorTrack, 'action' | 'actionSeq'> = {
      errorType: 'promise error',
      currentUri: window.location.href,
      stackInfo: 'promise error!',
      message: errorMsg,
    };

    if (errorMsg !== 'skip') this.createErrorTrack(errorInfo);
  }

  /**
   * @description: 常规错误 比如资源加载
   * @param {Event} event
   * @return {*}
   */
  protected addNormalErrTrack(event: Event) {
    const errorInfo: Omit<IErrorTrack, 'action' | 'actionSeq'> = {
      errorType: 'resource error',
      currentUri: window.location.href,
      stackInfo: 'resource is not found',
      message: (event.target as HTMLElement)?.outerHTML + ' is load error',
    };
    this.createErrorTrack(errorInfo);
  }
}

const errorPlugin = new ErrorPlugin();

export { errorPlugin, ErrorPlugin };
