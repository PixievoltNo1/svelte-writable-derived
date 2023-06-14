# svelte-writable-derived
[![npm](https://img.shields.io/npm/v/svelte-writable-derived.svg)](https://www.npmjs.com/package/svelte-writable-derived)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/svelte-writable-derived.svg)](https://bundlephobia.com/result?p=svelte-writable-derived)
[![GitHub CI Status](https://img.shields.io/github/actions/workflow/status/PixievoltNo1/svelte-writable-derived/node.js.yml?branch=master&label=tests)](https://github.com/PixievoltNo1/svelte-writable-derived/actions/workflows/node.js.yml)
[![License](https://img.shields.io/github/license/PixievoltNo1/svelte-writable-derived.svg)](https://github.com/PixievoltNo1/svelte-writable-derived/blob/master/LICENSE.txt)
![GitHub Repo stars](https://img.shields.io/github/stars/PixievoltNo1/svelte-writable-derived?style=social)

For users of [Svelte](https://svelte.dev/) v3 and v4, this is a read-write variant of Svelte's [derived stores](https://svelte.dev/tutorial/derived-stores) that accepts an extra callback to send values back to the source. It builds on the derived & writable stores provided by Svelte, and emulates their behavior as closely as possible.

This project has a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in the Git repo or issues tracker, you agree to be as courteous, welcoming, and generally a lovely person as its terms require. 😊

<!-- Table of contents generated mostly by the markdown-toc package - however, it includes emoji in the URLs, and they need to be stripped for GitHub -->

<!-- toc -->

  * [Default & named export: `writableDerived()`](#default--named-export-writablederived)
    + [New parameter: `reflect`](#new-parameter-reflect)
  * [Named export: `propertyStore()`](#named-export-propertystore)
  * [Regarding Subscription-less `svelte-writable-derived` Stores](#regarding-subscription-less-svelte-writable-derived-stores)
  * [Examples](#examples)
    + [Making an object store from a JSON string store](#making-an-object-store-from-a-json-string-store)
    + [Making a single-value store from an object store](#making-a-single-value-store-from-an-object-store)
      - [... when the object is an array](#-when-the-object-is-an-array)
      - [... when the value is deeply nested in the object](#-when-the-value-is-deeply-nested-in-the-object)
    + [Making an object store from several single-value stores](#making-an-object-store-from-several-single-value-stores)
    + [Chaining all of the above together](#chaining-all-of-the-above-together)
  * [Browser compatibility](#browser-compatibility)
- [💖 Support the developer](#-support-the-developer)
  * [💸 ... with money](#--with-money)
  * [💌 ... with kind words](#--with-kind-words)
  * [🤝 ... with a job](#--with-a-job)

<!-- tocstop -->

## Default & named export: `writableDerived()`

<i>Parameters: `origins` ([store](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract) or array of stores), `derive` (function), [`reflect`](#new-parameter-reflect) (see documentation), optional `initial` (any)</i><br>
<i>Returns a store with [`writable`](https://svelte.dev/docs#run-time-svelte-store-writable) methods</i>

Create a store that behaves similarly to [Svelte's `derived`](https://svelte.dev/docs#run-time-svelte-store-derived), with `origins`, `derive`, and `initial` working like its 1st, 2nd, and 3rd parameters respectively. Values introduced to the store via its `set` and `update` methods are passed to the new 3rd parameter, `reflect`, which can in turn set values for the origin stores.

As long as `derived` and `reflect` set stores only by the means provided to them and not via any store's methods, they won't trigger calls to each other.

### New parameter: `reflect`

<i>Function with parameters: `reflecting` (any), optional `old` (any)</i>

This function is called when the derived store gets a new value via its `set` and `update` methods (not via the `derive` callback). Its `reflecting` parameter is this new value, and `old` is the origin store's current value, or an array of values if `origins` is an array. It must return a value to set in the origin store, or an array of values to set if `origins` was an array. If the returned array is sparse or shorter than `origins`, it will only set the stores it has elements for, and other stores don't necessarily need to be writable.

`reflect` is called after the derived store's subscriptions are called. If the derived store has its `set` and/or `update` methods called again in the process of calling its subscriptions, `reflect` will be called only once, with the most-recently-set value.

`arguments`, default parameters, and rest parameters will not receive `old` unless the function's [length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) is at least 2.

## Named export: `propertyStore()`

<i>Parameters: `origin` ([store](https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract)), `propName` (string, number, symbol, or array of strings/numbers/symbols)</i><br>
<i>Returns a store with [`writable`](https://svelte.dev/docs#run-time-svelte-store-writable) methods</i>

A utility wrapper for `writableDerived`. Given a store containing an object, this function returns a store containing the value of the object's property `propName`. If `propName` is an array, it's used as a path to navigate nested objects.

## Regarding Subscription-less `svelte-writable-derived` Stores

One of the ways this package emulates the behavior of Svelte's `derived` is that it does not subscribe to any origin store until the derived store itself has a subscription. However, there's an exception: Calling the `set` and `update` methods when the derived store has no subscriptions will subscribe to & then unsubscribe from all its origins.

## Examples

### Making an object store from a JSON string store

```javascript
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var jsonStore = writable(`{"I'm a property": true}`);
var objectStore = writableDerived(
	jsonStore,
	(json) => JSON.parse(json),
	(object) => JSON.stringify(object)
);
console.log( Object.keys( get(objectStore) ) ); // ["I'm a property"]
objectStore.set({"I'm not a property": false});
console.log( get(jsonStore) ); // "{\"I'm not a property\": false}"
```

### Making a single-value store from an object store

```javascript
import { writable, get } from "svelte/store";
import { propertyStore } from "svelte-writable-derived";

var objectStore = writable({"a horse": "a horse", "of course": "of course"});
var valueStore = propertyStore(objectStore, "a horse");
console.log( get(valueStore) ); // "a horse"
valueStore.set("*whinny*");
console.log( get(objectStore) ); // {"a horse": "*whinny*", "of course": "of course"}

// propertyStore is just a wrapper. You could also use writableDerived directly:

import writableDerived from "svelte-writable-derived";

var valueStore = writableDerived(
	objectStore,
	(object) => object["a horse"],
	(reflecting, object) => {
		object["a horse"] = reflecting;
		return object; // needed to call objectStore.set with the proper value
	}
);
```

#### ... when the object is an array

```javascript
// An array is an object with numerically-named properties.
// Access them using a number for the propName parameter.

import { writable, get } from "svelte/store";
import { propertyStore } from "svelte-writable-derived";

var treasureCoordinates = writable([7, -2, 31]);
var treasureElevation = propertyStore(treasureCoordinates, 1);
console.log( get(treasureElevation) ); // -2
treasureElevation.set(1); // dig up the treasure
console.log( get(treasureCoordinates) ); // [7, 1, 31]
```

#### ... when the value is deeply nested in the object

```javascript
import { writable, get } from "svelte/store";
import { propertyStore } from "svelte-writable-derived";

var objectStore = writable({ deeply: { buried: { item: "trash" } } });
var valueStore = propertyStore(objectStore, ["deeply", "buried", "item"]);
console.log( get(valueStore) ); // "trash"
valueStore.set("treasure");
console.log( get(objectStore) ); // { deeply: { buried: { item: "treasure" } } }

// Using writableDerived directly:

import writableDerived from "svelte-writable-derived";

var valueStore = writableDerived(
	objectStore,
	(object) => object.deeply.buried.item,
	(reflecting, object) => {
		object.deeply.buried.item = reflecting;
		return object; // needed to call objectStore.set with the proper value
	}
);
```

### Making an object store from several single-value stores

```javascript
import { writable, get } from "svelte/store";
import writableDerived from "svelte-writable-derived";

var valueStore1 = "sparta", valueStore2 = "monty python's flying circus";
var objectStore = writableDerived(
	[valueStore1, valueStore2],
	([value1, value2]) => ( {"this is": value1, "it's": value2} ),
	(object) => [ object["this is"], object["it's"] ]
);
console.log( get(objectStore) ); // {"this is": "sparta", "it's": "monty python's flying circus"}
objectStore.set( {"this is": "rocket league", "it's": "over 9000"} );
console.log( get(valueStore1), get(valueStore2) ); // "rocket league" "over 9000"
```

### Chaining all of the above together

```javascript
// What if Rube Goldberg were a JavaScript developer?
import { writable, get } from "svelte/store";
import { writableDerived, propertyStore } from "svelte-writable-derived";

var jsonStore = writable(`{"owner": "dragon", "possessions": ["crown", "gold"]}`);
var hoardStore = writableDerived(
	jsonStore,
	(json) => JSON.parse(json),
	(object) => JSON.stringify(object)
);

var hoarderStore = propertyStore(hoardStore, "owner");
var hoardContentsStore = propertyStore(hoardStore, "possessions");

var itemListStore = writableDerived(
	[hoarderStore, hoardContentsStore],
	([hoarder, hoardContents]) => {
		return hoardContents.map( (item) => {
			return {item, owner: hoarder};
		});
	},
	(itemList) => {
		// This is only for demonstration purposes, so we won't handle differing owners
		var hoarder = itemList[0].owner;
		var hoardContents = itemList.map( (itemListEntry) => {
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
	Upon the update, the console logs:
	[{item: "crown", owner: "protagonist"}, {item: "gold", owner: "protagonist"}]
	"protagonist"
	{owner: "protagonist", possessions: ["crown", "gold"]}
	"{\"owner\": \"protagonist\", \"possessions\": [\"crown\", \"gold\"]}"
*/
```

## Browser compatibility

This package should run anywhere Svelte can run. Use transpilers/polyfills as needed.

# 💖 Support the developer

I muchly appreciate any way you'd like to show your thanks - knowing people are helped gives me warm fuzzies and makes it all worthwhile!

## 💸 ... with money

At [my Ko-Fi page](https://ko-fi.com/pixievoltno1), you can make a one-time or monthly donation, or [commission work on an issue](https://ko-fi.com/pixievoltno1/commissions).

You can also support *all* your dependencies at once using [StackAid](https://www.stackaid.us/)!

## 💌 ... with kind words

Current contact info is on [this page](https://pixievoltno1.com/contact/) - or you can create an "issue" on this repo just to say thanks! Thank-you "issues" will be closed right away, but are treasured regardless~

## 🤝 ... with a job

Want me to sling some JavaScript for you? [Look over my other work](https://github.com/PixievoltNo1) and [contact me!](https://pixievoltno1.com/contact/)