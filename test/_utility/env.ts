import { JSDOM } from "jsdom";

const dom = new JSDOM("", { pretendToBeVisual: true });

global.window = dom.window as any;
for (const key of <(keyof typeof window)[]> [
	"document",
	"requestAnimationFrame",
	"MutationObserver",
	"Node",
	"Element",
	"NodeFilter"
]) {
	(global as any)[key] = dom.window[key];
}
