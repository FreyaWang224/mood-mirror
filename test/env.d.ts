declare module "cloudflare:test" {
  export const env: {
    DB: D1Database;
  };
  export const SELF: Fetcher;
}

interface TestFunction {
  (name: string, callback: () => unknown | Promise<unknown>): void;
  each(
    cases: ReadonlyArray<readonly unknown[]>,
  ): (
    name: string,
    callback: (...values: any[]) => unknown | Promise<unknown>,
  ) => void;
}

declare const beforeEach: (
  callback: () => unknown | Promise<unknown>,
) => void;
declare const describe: (
  name: string,
  callback: () => unknown | Promise<unknown>,
) => void;
declare const it: TestFunction;
declare const expect: <T = unknown>(actual: T) => any;
