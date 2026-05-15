// Provides type declarations for rxjs when the package doesn't ship its own .d.ts files.
declare module 'rxjs' {
  export class Observable<T> {
    constructor(subscribe?: (subscriber: any) => void);
    pipe<R>(...operations: ((source: Observable<any>) => Observable<any>)[]): Observable<R>;
    subscribe(observer?: any): any;
  }

  export class Subject<T> extends Observable<T> {
    next(value: T): void;
    error(err: any): void;
    complete(): void;
    asObservable(): Observable<T>;
  }

  export function firstValueFrom<T>(source: Observable<T>): Promise<T>;
  export function from<T>(input: any): Observable<T>;
  export function of<T>(...values: T[]): Observable<T>;
  export function map<T, R>(project: (value: T, index: number) => R): (source: Observable<T>) => Observable<R>;
}
