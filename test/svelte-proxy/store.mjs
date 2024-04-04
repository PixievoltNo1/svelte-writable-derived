import * as svelte3 from "svelte3/store";
import * as svelte4 from "svelte4/store";
import * as svelte5 from "svelte5/store";

export var writable, readable, derived, get;
export function loadSvelte3() {
	({writable, readable, derived, get} = svelte3);
}
export function loadSvelte4() {
	({writable, readable, derived, get} = svelte4);
}
export function loadSvelte5() {
	({writable, readable, derived, get} = svelte5);
}