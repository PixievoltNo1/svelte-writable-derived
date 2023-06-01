import { writableDerived, propertyStore, default as defaultExport } from "../index.mjs";
import { writable, readable, get } from "svelte/store";
import { strict as assert} from "assert";

describe("origins parameter", function() {
	specify("get subscribed to only when the derived store is subscribed to", function() {
		var subscriptionAllowed = false, passing = false;
		var origin = writable(0, () => {
			assert.ok(subscriptionAllowed);
			passing = true;
		});
		var testing = writableDerived(origin, () => 1, () => 1);
		subscriptionAllowed = true;
		testing.subscribe(() => {});
		assert.ok(passing);
	});
	specify("get unsubscribed from when the derived store has no more subscriptions", function() {
		var unsubscriptionAllowed = false, passing = false;
		var origin = writable(0, () => {
			return () => {
				assert.ok(unsubscriptionAllowed);
				passing = true;
			};
		});
		var testing = writableDerived(origin, () => 1, () => 1);
		var unsubscribe1 = testing.subscribe(() => {});
		var unsubscribe2 = testing.subscribe(() => {});
		unsubscribe1();
		unsubscriptionAllowed = true;
		unsubscribe2();
		assert.ok(passing);
	});
});
describe("derive parameter", function() {
	function deriveSetTests(makeSetter) {
		specify("set the derived store's value", function() {
			var expected = 1, actual;
			var {derive, whenDone} = makeSetter(1);
			var testing = writableDerived(writable(0), derive, () => {});
			testing.subscribe( (value) => { actual = value; } );
			return whenDone( () => {
				assert.equal(get(testing), expected);
			} );
		});
		specify("does not call reflect", function() {
			var {derive, whenDone} = makeSetter(1);
			var testing = writableDerived(writable(0), derive, () => {
				assert.fail();
			});
			testing.subscribe( () => {} );
			return whenDone( () => {} );
		});
	}
	describe("synchronous form", function() {
		deriveSetTests(function makeSetter(setValue) {
			return {
				derive: () => setValue,
				whenDone: (fn) => { fn(); },
			}
		});
	});
	describe("asynchronous form", function() {
		deriveSetTests(function makeSetter(setValue) {
			var setIsDone;
			var whenSetDone = new Promise( (resolve) => { setIsDone = resolve; } );
			return {
				derive(value, set) {
					Promise.resolve().then( () => {
						set(setValue);
						setIsDone();
					} );
				},
				whenDone(fn) { return whenSetDone.then(fn); },
			};
		});
		specify("can set synchronously", function() {
			var expected = 1;
			var testing = writableDerived(writable(0), (value, set) => {
				set(expected);
			}, () => {}, 2)
			assert.equal(get(testing), expected);
		});
		specify("does not set with the return value", function() {
			var unexpected = () => {};
			var testing = writableDerived(writable(0), (value, set) => {
				return unexpected;
			}, () => {}, 2);
			assert.notEqual(get(testing), unexpected);
		});
		specify("return value called as a cleanup function", function() {
			var origin = writable(0);
			var noOfCalls = 0;
			var testing = writableDerived(origin, (value, set) => {
				return () => { ++noOfCalls; };
			}, () => {});
			var unsubscribe = testing.subscribe(() => {});
			origin.set(1);
			unsubscribe();
			assert.equal(noOfCalls, 2);
		});
		specify("first subscription does not update derived store until set", function() {
			var expected = 2;
			var setter;
			var testing = writableDerived(writable(0), (value, set) => {
				setter = set;
			}, (reflecting, set) => {});
			var unsubscribe = testing.subscribe(() => {});
			setter(1);
			unsubscribe();
			testing.set(expected);
			testing.subscribe(() => {});
			assert.equal(get(testing), expected);
		});
		specify("derived has initial value until first set", function () {
			var expected = 1;
			var testing = writableDerived(writable(0), (value, set) => {}, () => {}, expected);
			testing.subscribe(() => {});
			assert.equal(get(testing), expected);
		});
	});
});
describe("reflect parameter", function() {
	specify("not called when new and old values are equal primitives", function() {
		var testing = writableDerived(writable(), () => 1, () => {
			assert.fail();
		});
		testing.subscribe( () => {} );
		testing.set(1);
	});
	specify("called after subscriptions", function() {
		var actual = [], collectSubscriptionCalls = false;
		var testing = writableDerived(writable(), () => 1, (reflecting, set) => {
			actual.push("reflect");
		});
		testing.subscribe( () => {
			if (collectSubscriptionCalls) {
				actual.push("subscription");
			}
		} );
		collectSubscriptionCalls = true;
		testing.set(2);
		assert.deepStrictEqual(actual, ["subscription", "reflect"]);
	});
	specify("called only once with latest value when subscriptions set or update", function() {
		var actual = [];
		var testing = writableDerived(writable(), () => 1, (reflecting, set) => {
			actual.push(reflecting);
		});
		testing.subscribe( (value) => {
			if (value == 2) {
				testing.set(3);
			}
		} );
		testing.set(2);
		assert.deepStrictEqual(actual, [3]);
	});
	specify("same primitive value set by subscriptions does not cancel call", function() {
		var passed;
		var testing = writableDerived(writable(), () => 1, (reflecting) => {
			passed = reflecting == 2;
		});
		testing.subscribe( (value) => {
			if (value == 2) {
				testing.set(2);
			}
		} );
		testing.set(2);
		assert.ok(passed);
	});
	describe("reflecting parameter", function () {
		specify("received from set", function () {
			var passed;
			var testing = writableDerived(writable(), () => 1, (reflecting) => {
				passed = reflecting == 2;
			});
			testing.set(2);
			assert.ok(passed);
		});
		specify("received from update", function () {
			var passed;
			var testing = writableDerived(writable(), () => 1, (reflecting) => {
				passed = reflecting == 2;
			});
			testing.update(() => 2);
			assert.ok(passed);
		});
	});
	describe("old parameter", function () {
		specify("passes single origin", function () {
			var origin = writable(1);
			var expected = 1;
			var testing = writableDerived(origin, () => 3, (reflecting, old) => {
				assert.deepStrictEqual(old, expected);
				return old;
			});
			testing.set(4);
		});
		specify("passes multiple origins (incl. non-writables)", function () {
			var origins = [writable(1), readable(2, () => { })];
			var expected = [1, 2];
			var testing = writableDerived(origins, () => 3, (reflecting, old) => {
				assert.deepStrictEqual(old, expected);
				return [];
			});
			testing.set(4);
		});
	});
	describe("return value", function () {
		specify("sets single origin", function () {
			var origin = writable(0);
			var expected = 3;
			var testing = writableDerived(origin, () => 1, () => expected);
			testing.set(2);
			assert.equal(get(origin), expected);
		});
		specify("sets multiple origins", function () {
			var origins = [writable(1), writable(2)];
			var expected = [3, 4];
			var testing = writableDerived(origins, () => 0, () => expected);
			testing.set(-1);
			assert.deepStrictEqual(expected, origins.map(get));
		});
		specify("sets subset of multiple origins", function () {
			var origins = [writable(1), writable(2), writable(3), writable(4)];
			var expected = [5, 2, 6, 4];
			var testing = writableDerived(origins, () => 0, () => [expected[0], , expected[2]]);
			testing.set(-1);
			assert.deepStrictEqual(expected, origins.map(get));
		});
		specify("does not call derived", function () {
			var deriveAllowed = true;
			var testing = writableDerived(writable(0), () => {
				assert.ok(deriveAllowed);
				return 0;
			}, () => 1);
			testing.subscribe(() => { });
			deriveAllowed = false;
			testing.set(1);
		});
		specify("allows derive if a single origin updates itself", function () {
			var deriveNeeded = false, deriveHappened = false;
			var origin = writable(0);
			origin.subscribe((value) => {
				if (value == 1) {
					deriveNeeded = true;
					origin.set(2);
				}
			});
			var testing = writableDerived(origin, () => {
				if (deriveNeeded) {
					deriveHappened = true;
				}
				return 0;
			}, () => 1);
			testing.subscribe(() => { });
			testing.set(1);
			assert.ok(deriveHappened);
		});
		specify("allows derive if multiple origins update themselves", function () {
			var derive1Needed = false, derive1Happened = false;
			var derive2Needed = false, derive2Happened = false;
			var origins = [writable(1), writable(2), writable(3), writable(4)];
			origins[1].subscribe((value) => {
				if (value == 6) {
					derive1Needed = true;
					origins[1].set(9);
				}
			});
			origins[3].subscribe((value) => {
				if (value == 8) {
					derive2Needed = true;
					origins[3].set(10);
				}
			});
			var testing = writableDerived(origins, (values) => {
				if (derive2Needed) {
					assert.deepStrictEqual(values, [5, 9, 7, 10]);
					derive2Happened = true;
				} else if (derive1Needed) {
					assert.deepStrictEqual(values, [5, 9, 3, 4]);
					derive1Happened = true;
				}
				return 0;
			}, () => [5, 6, 7, 8]);
			testing.subscribe(() => { });
			testing.set(1);
			assert.ok(derive1Happened);
			assert.ok(derive2Happened);
		});
	});
});
describe("set method", function() {
	specify("calls derive if there are no subscribers", function() {
		var passing = false;
		var testing = writableDerived(writable(), () => {
			passing = true;
		}, () => {});
		testing.update( () => {} );
		assert.ok(passing);
	});
});
describe("update method", function() {
	specify("calls derive if there are no subscribers", function() {
		var passing = false;
		var testing = writableDerived(writable(), () => {
			passing = true;
		}, () => {});
		testing.update( () => {} );
		assert.ok(passing);
	});
});
describe("subscribe method", function() {
	specify("first subscription gets its first call after derive", function() {
		var subscriptionCallAllowed = false;
		var testing = writableDerived(writable(), () => {
			subscriptionCallAllowed = true;
		}, () => {});
		testing.subscribe( () => {
			assert.ok(subscriptionCallAllowed);
		} );
	});
	specify("lets svelte correctly handle diamond dependencies", function() {
		var level1 = writable(1);
		var level2a = writableDerived(level1, (l1Val) => {
			return l1Val * 10;
		}, () => {});
		var level2b = writableDerived(level1, (l1Val) => {
			return l1Val * 100;
		}, () => {});
		var level3 = writableDerived([level2a, level2b], ([l2aVal, l2bVal]) => {
			return l2aVal + l2bVal;
		}, () => {});
		var actual = [];
		level3.subscribe( (value) => {
			actual.push(value);
		} );
		level1.set(2);
		assert.deepStrictEqual(actual, [110, 220]);
	});
});
describe("default export", function () {
	specify("alias for writableDerived named export", function() {
		assert.equal(defaultExport, writableDerived);
	});
});
describe("propertyStore", function () {
	describe("single-value propName", function () {
		specify("new store has the specified property's value", function() {
			var expected = 1;
			var origin = writable({prop: expected});
			var testing = propertyStore(origin, "prop");
			assert.equal(get(testing), expected);
		});
		specify("setting the new store updates the original", function() {
			var expected = { prop: 2 };
			var origin = writable({ prop: 1 });
			var testing = propertyStore(origin, "prop");
			testing.set(expected.prop);
			assert.deepEqual(get(origin), expected);
		});
	});
	describe("array propName", function () {
		specify("new store has the specified property's value", function() {
			var expected = 1;
			var origin = writable({ nested: { prop: expected } });
			var testing = propertyStore(origin, ["nested", "prop"]);
			assert.equal(get(testing), expected);
		});
		specify("setting the new store updates the original", function() {
			var expected = { nested: { prop: 2 } };
			var origin = writable({ nested: { prop: 1 } });
			var testing = propertyStore(origin, ["nested", "prop"]);
			testing.set(expected.nested.prop);
			assert.deepEqual(get(origin), expected);
		});
		specify("mutating the array doesn't affect behavior", function() {
			var origin = writable({
				nested: { prop: 1 },
				get incorrect() {
					assert.fail("mutated array element used")
				},
			});
			var propPath = ["nested", "prop"];
			var testing = propertyStore(origin, propPath);
			propPath[0] = "incorrect";
			get(testing);
		});
	});
});