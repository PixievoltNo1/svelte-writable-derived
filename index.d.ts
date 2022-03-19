import type { Readable, Writable } from "svelte/store";

// Source of `Stores` and `StoresValues`:
// https://github.com/sveltejs/svelte/blob/master/src/runtime/store/index.ts

/** One or more `Readable`s. */
type Stores = Readable<any> | [Readable<any>, ...Array<Readable<any>>] | Array<Readable<any>>;

/** One or more values from `Readable` stores. */
type StoresValues<T> = T extends Readable<infer U> ? U :
    { [K in keyof T]: T[K] extends Readable<infer U> ? U : never };

/**
 * Create a store similar to [Svelte's `derived`](https://svelte.dev/docs#derived), but which
 * has its own `set` and `update` methods and can send values back to the origin stores.
 * [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#default-export-writablederived)
 *
 * @param origins One or more stores to derive from. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 1st parameter.
 * @param derive The callback to determine the derived value. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 2nd parameter.
 * @param reflect Called when the
 * derived store gets a new value via its `set` or `update` methods, and determines new values for
 * the origin stores. [Read more...](https://github.com/PixievoltNo1/svelte-writable-derived#new-parameter-reflect)
 * @param [initial] The new store's initial value. Same as
 * [`derived`](https://svelte.dev/docs#derived)'s 3rd parameter.
 *
 * @returns A writable store.
 */
export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>) => T,
    reflect: (reflecting: T) => StoresValues<S>,
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>, set: (value: T) => void) => void,
    reflect: (reflecting: T) => StoresValues<S>,
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>) => T,
    reflect: (reflecting: T, set: (value: StoresValues<S>) => void) => void,
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>, set: (value: T) => void) => void,
    reflect: (reflecting: T, set: (value: StoresValues<S>) => void) => void,
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>) => T,
    reflect: { withOld: (reflecting: T, old: StoresValues<S>) => StoresValues<S> },
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>, set: (value: T) => void) => void,
    reflect: { withOld: (reflecting: T, old: StoresValues<S>) => StoresValues<S> },
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>) => T,
    reflect: {
        withOld: (reflecting: T, old: StoresValues<S>, set: (value: StoresValues<S>) => void) => void
    },
    initial?: T
): Writable<T>;

export default function writableDerived<S extends Stores, T>(
    origins: S,
    derive: (values: StoresValues<S>, set: (value: T) => void) => void,
    reflect: {
        withOld: (reflecting: T, old: StoresValues<S>, set: (value: StoresValues<S>) => void) => void
    },
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
    origin: Writable<O>,
    propName: K | [K]
): Writable<O[K]>;

export function propertyStore<O extends object, K1 extends keyof O, K2 extends keyof O[K1]>(
    origin: Writable<O>,
    propName: [K1, K2]
): Writable<O[K1][K2]>;

export function propertyStore<
    O extends object,
    K1 extends keyof O,
    K2 extends keyof O[K1],
    K3 extends keyof O[K1][K2]
>(
    origin: Writable<O>,
    propName: [K1, K2, K3]
): Writable<O[K1][K2][K3]>;

export function propertyStore<
    O extends object,
    K1 extends keyof O,
    K2 extends keyof O[K1],
    K3 extends keyof O[K1][K2],
    K4 extends keyof O[K1][K2][K3]
>(
    origin: Writable<O>,
    propName: [K1, K2, K3, K4]
): Writable<O[K1][K2][K3][K4]>;

export function propertyStore(
    origin: Writable<object>,
    propName: string | number | symbol | Array<string | number | symbol>
): Writable<any>;