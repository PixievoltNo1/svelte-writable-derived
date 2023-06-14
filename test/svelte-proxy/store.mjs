import * as svelte3 from "svelte3/store";
import * as svelte4 from "svelte4/store";

export var writable, readable, derived, get;
export function loadSvelte3() {
	({writable, readable, derived, get} = svelte3);
}
export function loadSvelte4() {
	({writable, readable, derived, get} = svelte4);
}