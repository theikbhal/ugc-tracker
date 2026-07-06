declare module 'papaparse' {
  interface ParseConfig {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean;
    [key: string]: unknown;
  }

  interface ParseResult<T> {
    data: T[];
    errors: unknown[];
    meta: Record<string, unknown>;
  }

  function unparse(data: unknown[], config?: ParseConfig): string;
  function parse<T>(input: string | File, config?: ParseConfig): ParseResult<T>;

  export default { unparse, parse };
  export { unparse, parse };
}
