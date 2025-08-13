declare module 'papaparse' {
  import { ParseConfig, ParseResult } from 'papaparse';
  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
    unparse(data: any, config?: any): string;
  };
  export = Papa;
}
declare module 'papaparse' {
  import { ParseConfig, ParseResult } from 'papaparse';
  const Papa: {
    parse<T>(file: File, config: ParseConfig<T>): void;
  };
  export = Papa;
}
