import type { TrackData } from '@/types';
/**
 * @description: 当文档加载完毕触发
 * @return {*}
 */
export const onDocumentLoaded = (): Promise<void> => {
  return new Promise(resolve => {
    window.addEventListener('DOMContentLoaded', () => resolve(), false);
  });
};

/**
 * @description: 处理promise错误内容
 * @param {any} reason
 * @return {*}
 */
export const transformPromiseError = (reason: any) => {
  if (typeof reason === 'object') {
    if (reason.request) return reason.request.responseText;
    else if (reason.target) return 'skip';
  }
  return reason?.message ?? reason;
};

/**
 * @description: 排序追踪数据
 * @param {TrackData} trackData
 * @return {*}
 */
export const sortTrackDataBySeq = (trackData: TrackData[]) => {
  return trackData.sort((prev, next) => prev.actionSeq - next.actionSeq);
};
