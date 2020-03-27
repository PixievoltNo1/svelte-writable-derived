import { derived } from "svelte/store";
/**
 * @external Store
 * @see [Svelte stores]{@link https://svelte.dev/docs#Store_contract}
 */

/**
 * Create a store similar to {@link https://svelte.dev/docs#derived Svelte's `derived`}, but which
 * has its own `set` and `update` methods and can send values back to the origin stores.
 * {@link https://github.com/PixievoltNo1/svelte-writable-derived#default-export-writablederived Read more...}
 * 
 * @param {Store|Store[]} origins One or more stores to derive from. Same as
 * {@link https://svelte.dev/docs#derived `derived`}'s 1st parameter.
 * @param {!Function} derive The callback to determine the derived value. Same as
 * {@link https://svelte.dev/docs#derived `derived`}'s 2nd parameter.
 * @param {!Function|{withOld: !Function}} reflect Called when the
 * derived store gets a new value via its `set` or `update` methods, and determines new values for
 * the origin stores. {@link https://github.com/PixievoltNo1/svelte-writable-derived#new-parameter-reflect Read more...}
 * @param [initial] The new store's initial value. Same as
 * {@link https://svelte.dev/docs#derived `derived`}'s 3rd parameter.
 * 
 * @returns {Store} A writable store.
 */
export default function writableDerived(origins, derive, reflect, initial) {
	var childDerivedSetter, originValues, allowDerive = true;
	var reflectOldValues = "withOld" in reflect;
	var wrappedDerive = (got, set) => {
		childDerivedSetter = set;
		if (reflectOldValues) {
			originValues = got;
		}
		if (allowDerive) {
			let returned = derive(got, set);
			if (derive.length < 2) {
				set(returned);
			} else {
				return returned;
			}
		}
	};
	var childDerived = derived(origins, wrappedDerive, initial);
	
	var singleOrigin = !Array.isArray(origins);
	var sendUpstream = (setWith) => {
		allowDerive = false;
		if (singleOrigin) {
			origins.set(setWith);
		} else {
			setWith.forEach( (value, i) => {
				origins[i].set(value);
			} );
		}
		allowDerive = true;
	};
	if (reflectOldValues) {
		reflect = reflect.withOld;
	}
	var reflectIsAsync = reflect.length >= (reflectOldValues ? 3 : 2);
	var cleanup = null;
	function doReflect(reflecting) {
		if (cleanup) {
			cleanup();
			cleanup = null;
		}

		if (reflectOldValues) {
			var returned = reflect(reflecting, originValues, sendUpstream);
		} else {
			var returned = reflect(reflecting, sendUpstream);
		}
		if (reflectIsAsync) {
			if (typeof returned == "function") {
				cleanup = returned;
			}
		} else {
			sendUpstream(returned);
		}
	}
	
	var doneUpdateId = 0;
	function update(fn) {
		var tryingSet = false, isUpdated, updateId = doneUpdateId + 1, oldValue;
		var unsubscribe = childDerived.subscribe( (value) => {
			if (!tryingSet) {
				oldValue = value;
			} else {
				isUpdated = true;
			}
		} );
		var newValue = fn(oldValue);
		tryingSet = true;
		childDerivedSetter(newValue);
		unsubscribe();
		if (isUpdated && updateId > doneUpdateId) {
			doneUpdateId = updateId;
			doReflect(newValue);
		}
	}
	return {
		subscribe: childDerived.subscribe,
		set(value) { update( () => value ); },
		update,
	};
}