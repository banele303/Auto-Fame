// Legacy Prisma proxy stub - app uses Convex backend
export const prisma: any = new Proxy({}, {
  get(_target, prop) {
    if (prop === '$disconnect' || prop === '$connect') {
      return async () => {};
    }
    return new Proxy({}, {
      get(_targetKey, _method) {
        return async () => null;
      }
    });
  }
});
