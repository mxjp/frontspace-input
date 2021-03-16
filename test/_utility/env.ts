import { JSDOM } from "jsdom";

const dom = new JSDOM("", { pretendToBeVisual: true });

global.window = dom.window as any;

for (const key of Object.getOwnPropertyNames(dom.window)) {
	if (!(key in global) && !/^\_/.test(key)) {
		Object.defineProperty(global, key, {
			configurable: false,
			enumerable: true,
			get: () => dom.window[key]
		})
	}
}
