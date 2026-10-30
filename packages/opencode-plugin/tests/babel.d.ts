/** Narrow declarations for the installed Babel operations exercised by build regression tests. */
declare module '@babel/core' {
  interface TransformOptions {
    filename: string;
    configFile: false;
    babelrc: false;
    presets: unknown[];
    sourceMaps?: boolean;
  }
  interface TransformResult {
    code?: string | null;
    map?: unknown;
  }
  export function transformAsync(
    source: string,
    options: TransformOptions,
  ): Promise<TransformResult | null>;
}
declare module '@babel/preset-typescript' {
  const preset: unknown;
  export default preset;
}
declare module 'babel-preset-solid' {
  const preset: unknown;
  export default preset;
}
