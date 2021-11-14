## Unreleased

- Fixed `reflect` not getting the latest value after a subscription updates its own store in Svelte >=3.6.9 ([#13](https://github.com/PixievoltNo1/svelte-writable-derived/issues/13))
- Documented in the readme & JSDocs that `propertyStore` accepts numerical `propName`s (though this is newly-documented, it's in a SemVer-patch release to indicate it's worked since 2.1.0)
- JSDocs now use Markdown \[links] instead of JSDoc {@link}s, working around VSCode bugs with the latter

## 2.1.1 (November 22, 2020)

No behavioral changes.

- Added repository, exports, & sideEffects fields to package.json

## 2.1.0 (July 24, 2020)

- Added: New export [`propertyStore`](README.md#named-export-propertystore), a `writableDerived` wrapper for making a derived store from a stored object's property with less boilerplate ([#5](https://github.com/PixievoltNo1/svelte-writable-derived/issues/5))
- Added: Named export `writableDerived` is an alias for the default export, allowing you to get both exports with names if you so choose
- JSDocs added. TypeScript can get type info from JSDocs, so TypeScript is now partially supported!

## 2.0.1 (June 14, 2019)

- Fixed: Setting/updating a store to a new primitive value, then setting/updating the store to the same value from its subscriptions would prevent `reflect` from being called
- Fixed: Setting/updating a subscriptionless store to the primitive value it already had could cause a spurious `reflect` call

## 2.0.0 (June 13, 2019)

- Changed: `reflect` is now either a function with signature `(reflecting, set)` or an object with interface `{ withOld(reflecting, old, set) }`. Async-ness is determined by whether the function accepts a `set` parameter, just as for the `derive` callback.
- Changed: The `reflect` callback now runs *after* subscriptions. Additional `set`/`update` calls while running subscriptions result in `reflect` being called only once with the most recent value.
- Changed: Changes to which operations cause a subscription-less `writableDerived` to subscribe-then-unsubscribe to all origins:
	- `set` method calls now do so
	- Getting old origin values in `reflect` no longer does so
- Optimization: Origin values are no longer kept if `reflect` will not need them
- Optimization: Participates in Svelte v3.5.0's [diamond dependencies solution](https://github.com/sveltejs/svelte/pull/2955) (downstream only; there is no diamond dependency handling for reflecting values back to their sources)
- Optimization: No more internal writable store; the `derived` is the only internal store remaining

If this update was useful for you, show your appreciation with [money](README.md#--with-money), [kind words](README.md#--with-kind-words), or [a job](README.md#--with-a-job)!

## 1.0.1 (June 7, 2019)

- Fixed: First subscription was getting its first call before `derive` ran
- Optimization: Internal derived store is no longer set; all sets go to the internal writable store (replaced with a different optimization in 2.0.0)

## 1.0.0 (June 2, 2019)

- Initial release