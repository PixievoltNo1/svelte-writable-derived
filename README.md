# svelte-writable-derived
[![npm](https://img.shields.io/npm/v/svelte-writable-derived.svg)](https://www.npmjs.com/package/svelte-writable-derived) [![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-writable-derived.svg)](https://bundlephobia.com/result?p=svelte-writable-derived) [![License](https://img.shields.io/github/license/PikadudeNo1/svelte-writable-derived.svg)](https://github.com/PikadudeNo1/svelte-writable-derived/blob/master/LICENSE.txt)

For users of [Svelte](https://svelte.dev/) v3, this is a read-write variant of Svelte's [derived stores](https://svelte.dev/tutorial/derived-stores) that accepts an extra callback to send values back to the source. It builds on the derived & writable stores provided by Svelte, and emulates their behavior as closely as possible.

This project has a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in the Git repo or issues tracker, you agree to be as courteous, welcoming, and generally a lovely person as its terms require. 😊

<!-- Table of contents generated mostly by the markdown-toc package - however, it includes emoji in the URLs, and they need to be stripped for GitHub -->
<!-- toc -->

  * [Default export: `writableDerived()`](#default-export-writablederived)
    + [New parameter: `reflect()`](#new-parameter-reflect)
  * [Regarding Subscription-less `writableDerived` Stores](#regarding-subscription-less-writablederived-stores)
  * [Examples](#examples)
    + [Making an object store from a JSON string store](#making-an-object-store-from-a-json-string-store)
    + [Making a single-value store from an object store](#making-a-single-value-store-from-an-object-store)
    + [Making an object store from several single-value stores](#making-an-object-store-from-several-single-value-stores)
    + [Chaining all of the above together](#chaining-all-of-the-above-together)
  * [Browser compatibility](#browser-compatibility)
- [💖 Support the developer](#-support-the-developer)
  * [💸 ... with money](#--with-money)
  * [💌 ... with kind words](#--with-kind-words)
  * [🤝 ... with a job](#--with-a-job)

<!-- tocstop -->

## Default export: `writableDerived()`

<i>Parameters: `origins` ([store](https://svelte.dev/tutorial/writable-stores) or array of stores), `derive` (function), [`reflect`](#new-parameter-reflect) (function), optional `initial` (any)</i><br>
<i>Returns a store with [`writable`](https://svelte.dev/docs#writable) methods</i>

Create a store that behaves similarly to [Svelte's `derived`](https://svelte.dev/docs#derived), with `origins`, `derive`, and `initial` working like its 1st, 2nd, and 3rd parameters respectively. Values introduced to the store via its `set` and `update` methods are passed to the new 3rd parameter, `reflect`, which can in turn set values for the origin stores.

It is not possible for `derived` and `reflect` to trigger calls to each other, provided they only use the `set` callbacks provided to them and do not reach out to any outer `set` or `update`.

### New parameter: `reflect()`

<i>Called with: object with `reflecting`, `old`, and `set` properties</i>
<i>Return value varies (see below)</i>

Called when the derived store is given a new value via its `set` and `update` methods (not via the `derive` callback), and can set new values on the origin stores without causing a call to `derive`.

`reflect` will be called before any of the derived store's subscriptions are called. If this results in any origin stores being set synchronously, their subscriptions will also be called before the derived store's subscriptions.

`reflect` is called with one parameter, an object that has these properties:

Name | Description
--- | ---
`reflecting` | The new value of the derived store.
`old` | The initial value of the origin stores. It's an array if `origins` was an array. (This is an accessor property, and has [special behavior for derived stores with no subscriptions](#regarding-subscription-less-writablederived-stores).)
`set()` | If `origins` is a single store, this takes its new value. If `origins` is an array of stores, this takes an array of values to set in each store. If the array you pass in is sparse or shorter than `origins`, this sets only the stores it has elements for, and other stores don't necessarily need to be writable. (This is an accessor property, and affects the treatment of the return value as per below.)

If the `set` property was not read, `reflect` is considered synchronous, and its return value will be used to set origin stores just as if it were passed to `set()`. If the `set` property *was* read, `reflect` is considered asynchronous, and its return value, if it's a function, is a cleanup function that will be called before the next `reflect` call. (Unlike its `derive` counterpart, `reflect`'s cleanup function is never called in response to unsubscriptions.)

It is recommended that your `reflect` function use a destructuring parameter, like so:

```javascript
var coolStore = writableDerived(origins, derive, reflectExample, initial);
function reflectExample({reflecting, old, set}) {
	// The set property was read in the process of destructuring.
	// Therefore, this function is guaranteed to be treated as asynchronous.
	return cleanup;
}
```

## Regarding Subscription-less `writableDerived` Stores

One of the ways `writableDerived` emulates the behavior of Svelte's `derived` is that it does not subscribe to any origin store until the derived store itself has a subscription. However, `writableDerived` makes an exception in certain situations to guarantee that values of interest are up-to-date.

When the derived store has no subscriptions, performing these operations will subscribe to & then unsubscribe from all its origins:

* Calling the derived store's `update` method
* Getting the `old` property of the object passed to `reflect`

## Examples

### Making an object store from a JSON string store

```javascript
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var jsonStore = writable(`{"I'm a property": true}`);
var objectStore = writableDerived(
	jsonStore,
	(json) => JSON.parse(json),
	({reflecting}) => JSON.stringify(reflecting)
);
console.log( Object.keys( get(objectStore) ) ); // ["I'm a property"]
objectStore.set({"I'm not a property": false});
console.log( get(jsonStore) ); // "{\"I'm not a property\": false}"
```

### Making a single-value store from an object store

```javascript
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var objectStore = writable({"a horse": "a horse", "of course": "of course"});
var valueStore = writableDerived(
	objectStore,
	(object) => object["a horse"],
	({reflecting, old}) => {
		old["a horse"] = reflecting;
		return old; // needed to ensure objectStore.set is called with the correct value
	}
);
console.log( get(valueStore) ); // "a horse"
valueStore.set("*whinny*");
console.log( get(objectStore) ); // {"a horse": "*whinny*", "of course": "of course"}
```

### Making an object store from several single-value stores

```javascript
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var valueStore1 = "sparta", valueStore2 = "monty python's flying circus";
var objectStore = writableDerived(
	[valueStore1, valueStore2],
	([value1, value2]) => ( {"this is": value1, "it's": value2} ),
	({reflecting}) => [ reflecting["this is"], reflecting["it's"] ]
);
console.log( get(objectStore) ); // {"this is": "sparta", "it's": "monty python's flying circus"}
objectStore.set( {"this is": "rocket league", "it's": "over 9000"} );
console.log( get(valueStore1), get(valueStore2) ); // "rocket league" "over 9000"
```

### Chaining all of the above together

```javascript
// What if Rube Goldberg were a JavaScript developer?
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var jsonStore = writable(`{"owner": "dragon", "possessions": ["crown", "gold"]}`);
var hoardStore = writableDerived(
	jsonStore,
	(json) => JSON.parse(json),
	({reflecting}) => JSON.stringify(reflecting)
);

var hoarderStore = writableDerived(
	objectStore,
	(hoard) => hoard["owner"],
	({reflecting, old}) => {
		old["owner"] = reflecting;
		return old;
	}
);
var hoardContentsStore = writableDerived(
	objectStore,
	(hoard) => hoard["possessions"],
	({reflecting, old}) => {
		old["possessions"] = reflecting;
		return old;
	}
);

var itemListStore = writableDerived(
	[hoarderStore, hoardContentsStore],
	([hoarder, hoardContents]) => {
		return hoardContents.map( (item) => {
			return {item, owner: "hoarder"};
		});
	},
	({reflecting}) => {
		// This is only for demonstration purposes, so we won't handle differing owners
		var hoarder = reflecting[0].owner;
		var hoardContents = reflecting.map( (itemListEntry) => {
			return itemListEntry["item"];
		} );
		return [hoarder, hoardContents];
	}
);

jsonStore.subscribe(console.log);
hoardStore.subscribe(console.log);
hoarderStore.subscribe(console.log);
// skipping hoardContentsStore
itemListStore.subscribe(console.log);
itemListStore.update( (itemList) => {
	return itemList.map( (itemListEntry) => {
		return {item: itemListEntry.item, owner: "protagonist"};
	} );
} );
/*
	reflect runs before subscribers. Since all our reflects are synchronous,
	before any subscribers can run, the next layer's set is called, which
	calls *its* reflect before *its* subscribers, and so on. This means
	stores will call their subscribers starting with the lowest/innermost
	layer and going up/out.
	
	Therefore, upon the update, the console logs:
	"{\"owner\": \"protagonist\", \"possessions\": [\"crown\", \"gold\"]}"
	{owner: "protagonist", possessions: ["crown", "gold"]}
	"protagonist"
	[{item: "crown", owner: "protagonist"}, {item: "gold", owner: "protagonist"}]
*/
```

## Browser compatibility

This package should run anywhere Svelte can run. Use transpilers/polyfills as needed.

# 💖 Support the developer

I muchly appreciate any way you'd like to show your thanks - knowing people are helped gives me warm fuzzies and makes it all worthwhile!

## 💸 ... with money

[I'm on Ko-Fi!](https://ko-fi.com/pikadudenoone) If you'd like to make a recurring donation, first please help me afford Ko-Fi Gold!

## 💌 ... with kind words

Current contact info is on [this page](https://pikadudeno1.com/contact/) - or you can create an "issue" on this repo just to say thanks! Thank-you "issues" will be closed right away, but are treasured regardless~

## 🤝 ... with a job

[I have a Developer Story on Stack Overflow!](https://stackoverflow.com/users/story/707043)