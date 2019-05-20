import { writable, derived, get as readStore } from "svelte/store";
export default function(origins, derive, reflect, initial) {
	var originValues, allowDerive = true, ignoreMe = {};
	var wrappedDerive = (got, set) => {
		originValues = got;
		if (allowDerive) {
			if (derive.length >= 2) {
				set(ignoreMe);
			}
			let returned = derive(got, set);
			if (derive.length < 2) {
				set(returned);
			} else {
				return returned;
			}
		}
	};
	var childDerived = derived(origins, wrappedDerive);
	var childWritable = writable(initial);
	
	var singleOrigin = !Array.isArray(origins), allowReflect = false, unsubscribeFromDerived;
	var cleanup = null;
	childWritable.subscribe((value) => {
		if (allowReflect) {
			if (cleanup) {
				cleanup();
				cleanup = null;
			}
			
			let isAsync = false;
			let setter = (setWith) => {
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
			let returned = reflect({
				reflecting: value,
				get old() {
					// We need an active subscription to childDerived for originValues to be usable
					if (unsubscribeFromDerived) {
						return originValues;
					} else {
						if (singleOrigin) {
							return readStore(origins);
						} else {
							return origins.map(readStore);
						}
					}
				},
				get set() {
					isAsync = true;
					return setter;
				},
			});
			if (isAsync) {
				if (typeof returned == "function") {
					cleanup = returned;
				}
			} else {
				setter(returned);
			}
		}
	});
	allowReflect = true;
	function listen() {
		unsubscribeFromDerived = childDerived.subscribe( (value) => {
			if (value == ignoreMe) { return; }
			allowReflect = false;
			childWritable.set(value);
			allowReflect = true;
		} );
	}
	function unlisten() {
		unsubscribeFromDerived();
		originValues = unsubscribeFromDerived = undefined;
	}
	
	var subscriberCount = 0;
	var me = {
		subscribe(subscriber) {
			var unsubscribe = childWritable.subscribe(subscriber);
			++subscriberCount;
			if (subscriberCount == 1) { listen(); }
			return () => {
				unsubscribe();
				--subscriberCount;
				if (subscriberCount == 0) { unlisten(); }
			};
		},
		set: childWritable.set,
		update(fn) {
			if (subscriberCount == 0) {
				// guarantee up-to-date value
				listen(), unlisten();
			}
			childWritable.update(fn);
		},
	};
	return me;
}