import { CachePlugin } from '@/core/plugins';

/* --------------------------------- 用户行为枚举 --------------------------------- */
type TTrackAction = 'Init' | 'Jump' | 'Click' | 'ERROR';

/* -------------------------------- 收集的接口相关数据 ------------------------------- */
interface ITrackApi {
  apiUri: string;
  apiMethod: string;
  apiReq: string;
  apiRes: string;
  apiHeaders: string;
  apiTiming: string;
}

/* ----------------------------- 每个行为需要收集的基本data ---------------------------- */
export interface ITrackBaseData {
  action: TTrackAction;
  actionSeq: number;
  currentUri: string;
  // trackApis?: ITrackApi[]; 暂时不收集 可以通过waf来检索 不然体量太大
}

/* --------------------------------- 错误的信息追踪 -------------------------------- */
export interface IErrorTrack extends ITrackBaseData {
  errorType: string;
  stackInfo: string;
  message: string;
  file?: string;
  otherMessage?: string;
}

/* --------------------------------- 元素事件追踪 --------------------------------- */
export interface IElementTrack extends ITrackBaseData {
  element: string;
  text: string;
  classes: string;
  triggerTiming: number;
}

/* --------------------------------- 路由变化追踪 --------------------------------- */
export interface IRouterTrack extends ITrackBaseData {
  fromUri?: string;
  prevStayTiming?: string;
}

/* ------------------------------- 聚合track数据格式 ------------------------------ */
export type TrackData =
  | ITrackBaseData
  | IErrorTrack
  | IElementTrack
  | IRouterTrack;

/* ------------------------------ track收集的数据格式 ------------------------------ */
export interface ITrackData {
  sessionId: string; // 一个session会话一个id，后续如果涉及到数据存储的话，根据会话ID & userId进行排查
  userId: string;
  browserId?: string;
  ip?: string;
  tracks: TrackData[];
}

/* --------------------------------- track配置 -------------------------------- */
export interface ITrackOptions {
  log: boolean; // 是否开启日志
  maxActions: number; // 可收集最大的action数据
  trackResources: boolean; // 是否追踪资源的加载
  trackErrors: ('script' | 'promise' | 'resource')[]; // 需要收集的错误内容
  enableCache: boolean; // 是否开启缓存
}

/* ---------------------------------- 上下文信息 --------------------------------- */
export interface ITrackContext {
  readonly options: ITrackOptions;
  readonly trackData: TrackData[];
  readonly sessionId: string;
  log: (step: string, message: unknown) => void;
  addTrackChain: (track: TrackData) => void;
  uploadTrackChain: () => void;
  overwriteTrackData: (tracks: TrackData[]) => void;
  registerCache: (cache: CachePlugin) => void;
}

/* --------------------------------- 插件类的设计 --------------------------------- */
export interface IPlugin {
  name: string; // 插件名字
  install: (context: ITrackContext) => void; // 插件注册方法，内部调用
  uninstall: () => void; // 取消注册
}
