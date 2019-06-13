## Unreleased

- Changed: The `reflect` callback now runs *after* subscriptions. Additional `set`/`update` calls while running subscriptions result in `reflect` being called only once with the most recent value.
- Changed: Changes to which operations cause a subscription-less `writableDerived` to subscribe-then-unsubscribe to all origins:
	- `set` method calls now do so
	- Getting old origin values in `reflect` no longer does so
- Optimization: Participates in Svelte v3.5.0's [diamond dependencies solution](https://github.com/sveltejs/svelte/pull/2955) (downstream only; there is no diamond dependency handling for reflecting values back to their sources)
- Optizimation: No more internal writable store; the only internal store is a `derived`

## 1.0.1 (June 7, 2019)

- Fixed: First subscription was getting its first call before `derive` ran
- Optimization: Internal derived store is no longer set; all sets go to the internal writable store

## 1.0.0 (June 2, 2019)

- Initial release