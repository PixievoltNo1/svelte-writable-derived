import type { Readable, Writable, Updater } from "svelte/store";

/** The minimal requirements of the
 * [writable store contract](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract).
 */
type MinimalWritable<T> = Pick<Writable<T>, "set" | "subscribe">;

/** Stores that may be used as origins. */
type Stores = MinimalWritable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;

/** Values retrieved from origin stores. */
type StoresValues<T> = T extends Readable<infer U> ? U :
    { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

/** Values sent to origin stores. */
type SetValues<T> = T extends MinimalWritable<infer U> ? U :
    { [K in keyof T]?: T[K] extends MinimalWritable<infer U> ? U : never };

/**
 * Create a store similar to [Svelte's `derived`](https://svelte.dev/docs#run-time-svelte-store-writable), but which
 * has its own `set` and `update` methods and can send values back to the origin stores.
 * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#default-export-writablederived)
 *
 * @param origins One or more stores to derive from. Same as
 * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 1st parameter.
 * @param derive The callback to determine the derived value. Same as
 * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 2nd parameter.
 * @param reflect Called when the
 * derived store gets a new value via its `set` or `update` methods, and determines new values for
 * the origin stores. [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#new-parameter-reflect)
 * @param [initial] The new store's initial value. Same as
 * [`derived`](https://svelte.dev/docs#run-time-svelte-store-writable)'s 3rd parameter.
 *
 * @returns A writable store.
 */
export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>) => T,
    reflect: (reflecting: T, old: StoresValues<S>) => SetValues<S>,
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>, set: (value: T) => void, update: Updater<T>) => void,
    reflect: (reflecting: T, old: StoresValues<S>) => SetValues<S>,
    initial?: T
): Writable<T>;

export { writableDerived };

/**
 * Create a store for a property value in an object contained in another store.
 * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#named-export-propertystore)
 *
 * @param origin The store containing the object to get/set from.
 * @param propName The property to get/set, or a path of
 * properties in nested objects.
 *
 * @returns A writable store.
 */
export function propertyStore<O extends object, K extends keyof O>(
    origin: MinimalWritable<O>,
    propName: K | [K]
): Writable<O[K]>;

export function propertyStore<O extends object, K1 extends keyof O, K2 extends keyof O[K1]>(
    origin: MinimalWritable<O>,
    propName: [K1, K2]
): Writable<O[K1][K2]>;

export function propertyStore<
    O extends object,
    K1 extends keyof O,
    K2 extends keyof O[K1],
    K3 extends keyof O[K1][K2]
>(
    origin: MinimalWritable<O>,
    propName: [K1, K2, K3]
): Writable<O[K1][K2][K3]>;

export function propertyStore<
    O extends object,
    K1 extends keyof O,
    K2 extends keyof O[K1],
    K3 extends keyof O[K1][K2],
    K4 extends keyof O[K1][K2][K3]
>(
    origin: MinimalWritable<O>,
    propName: [K1, K2, K3, K4]
): Writable<O[K1][K2][K3][K4]>;

export function propertyStore(
    origin: MinimalWritable<object>,
    propName: string | number | symbol | Array<string | number | symbol>
): Writable<any>;