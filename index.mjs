import { writable, derived, get as readStore } from "svelte/store";
export default function(origins, derive, reflect, initial) {
	var childDerivedSetter, originValues, allowDerive = true;
	var wrappedDerive = (got, set) => {
		childDerivedSetter = set;
		originValues = got;
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
	var cleanup = null;
	function doReflect(value) {
		if (cleanup) {
			cleanup();
			cleanup = null;
		}

		let isAsync = false;
		let returned = reflect({
			reflecting: value,
			old: originValues,
			get set() {
				isAsync = true;
				return sendUpstream;
			},
		});
		if (isAsync) {
			if (typeof returned == "function") {
				cleanup = returned;
			}
		} else {
			sendUpstream(returned);
		}
	}
	
	var activeUpdateId = 0;
	function update(fn) {
		var firstCall = true, isUpdated, updateId = ++activeUpdateId, oldValue;
		var unsubscribe = childDerived.subscribe( (value) => {
			if (firstCall) {
				oldValue = value;
				firstCall = false;
			} else {
				isUpdated = true;
			}
		} );
		var newValue = fn(oldValue);
		childDerivedSetter(newValue);
		unsubscribe();
		if (isUpdated && updateId == activeUpdateId) {
			doReflect(newValue);
		}
	}
	return {
		subscribe: childDerived.subscribe,
		set(value) { update( () => value ); },
		update,
	};
}