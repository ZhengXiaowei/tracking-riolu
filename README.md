# 介绍

代号**利路欧(Riolu)**，一个简易的，以当前浏览器会话活动为主的用户操作链路数据追踪。

## 功能

- [x] 操作链路追踪
- [x] 利用localforage缓存链路
- [x] 自定义插件系统
- [ ] 资源加载耗时追踪
- [ ] api上报链路数据

# 安装

```bash
# npm
npm i tracking-riolu

# pnpm
pnpm i tracking-riolu

# yarn
yarn add tracking-riolu
```

# 基本使用

```ts
// 导入
import RioluTracking from 'tracking-riolu';

// 初始化
RioluTracking.initialize()
```

# 参数 - ITrackOptions
| 属性             | 类型                                      | 默认值                  | 是否必填 | 描述                           |
| ---------------- | ----------------------------------------- | ----------------------- | -------- | ------------------------------ |
| `log`            | `boolean`                                 | `false`                 | 否       | 是否开启日志追踪               |
| `maxActions`     | `number`                                  | `20`                    | 否       | 每次会话所需要追踪的最大行为数 |
| `trackResources` | `boolean`                                 | `false`                 | 否       | 是否开启资源耗时追踪(功能暂无) |
| `trackErrors`    | `('script' \| 'promise' \| 'resource')[]` | `['script', 'promise']` | 否       | 需要追踪的错误类型             |
| `enableCache`    | `boolean`                                 | `true`                  | 否       | 是否开启链路缓存               |

# 自定义插件
自定义插件需要遵循以下标准：

## 插件开发
```ts
// custom.plugin.ts
import type { IPlugin, ITrackContext } from 'tracking-riolu';

class CustomPlugin implements IPlugin {
  name = 'CustomPlugin';

  protected context?: ITrackContext;

  install(context: ITrackContext) {
    // 注入上下文 具体上下文可查下表
    this.context = context;
  }

  uninstall() {
    // 当卸载时触发的逻辑
  }
}

const customPlugin = new CustomPlugin();

export { customPlugin };
```

## 插件注册
```ts
import RioluTracking from 'tracking-riolu';
import { customPlugin } from './custom.plugin';

// 初始化
RioluTracking.use(customPlugin).initialize();
```

## 插件上下文内容
| 属性                 | 类型                                    | 描述               |
| -------------------- | --------------------------------------- | ------------------ |
| `options`            | `ITrackOptions`                         | 当前Tracking的配置 |
| `trackData`          | `TrackData`                             | 已经追踪到的数据   |
| `sessionId`          | `string`                                | 当前浏览器会话ID   |
| `log`                | `(action: string, msg: string) => void` | log方法            |
| `addTrackChain`      | `(track: TrackData) => void`            | 添加链路数据的方法 |
| `uploadTrackChain`   | `() => void`                            | 上传的方法         |
| `overwriteTrackData` | `(tracks: TrackData[]) => void`         | 覆盖链路数据的方法 |
