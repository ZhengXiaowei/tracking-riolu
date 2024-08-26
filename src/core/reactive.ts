export const reactive = <T extends Object>(context: T) => {
  // 利用proxy构建一个响应式context
  return new Proxy(context, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      return result;
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      return result;
    },
  });
};
