export var writable, readable, derived, get;
export async function loadSvelteVer(v) {
	let svelte = await import(`svelte${v}/store`);
	({writable, readable, derived, get} = svelte);
}
let reloadNum = 1;
export async function reloadSvelteVer(v) {
	let svelteUrl = import.meta.resolve(`svelte${v}/store`);
	let svelte = await import(`${svelteUrl}#${reloadNum++}`);
	({writable, readable, derived, get} = svelte);
}