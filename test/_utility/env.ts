import { JSDOM } from "jsdom";
import test from "ava";

const dom = new JSDOM("", { pretendToBeVisual: true });

global.window = dom.window as any;

const trackedMutationObservers = new Map<MutationObserver, Node>();

class TrackedMutationObserver extends dom.window.MutationObserver {
	public observe(target: Node, options?: MutationObserverInit) {
		super.observe(target, options);
		trackedMutationObservers.set(this, target);
	}

	public disconnect() {
		super.disconnect();
		trackedMutationObservers.delete(this);
	}
}

const replacedAPI = new Map<keyof typeof dom.window, any>([
	["MutationObserver", TrackedMutationObserver]
]);

for (const key of Object.getOwnPropertyNames(dom.window)) {
	if (!(key in global) && !/^\_/.test(key)) {
		Object.defineProperty(global, key, {
			configurable: false,
			enumerable: true,
			get: () => replacedAPI.get(key) ?? dom.window[key]
		});
	}
}

test.after(t => {
	if (document.body.childNodes.length > 0) {
		t.fail("document body is not cleaned");
	}

	for (const [observer, node] of trackedMutationObservers) {
		if (node.isConnected) {
			t.log(observer, node);
			t.fail("at least one mutation observer has not been disconnected");
		}
	}

	// TODO: Test cleanup of event handlers.

	// TODO: Setup code coverage statistics.
	// TODO: Ensure 100% branch coverage for all things that can be tested without mocking api provided by jsdom.
});
