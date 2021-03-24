import test from "ava";
import { InputLayer, INPUT_NONE } from "../../src";
import { state } from "../../src/state";

const eventListeners: [EventTarget, string, EventListener, EventListenerOptions][] = [];

const addInputLayerEventListener = InputLayer.prototype.addEventListener;
InputLayer.prototype.addEventListener = function addEventListener(type: string, listener: EventListener, options: any) {
	eventListeners.push([window, type, listener, options]);
	return addInputLayerEventListener.call(this, type, listener, options);
};

function clearState() {
	state.inputLayerRoots.length = 0;
	state.inputType = INPUT_NONE;
	state.inputDetectionTeardown?.();
	state.inputDetectionTeardown = null;

	state.cycleFocus = false;
	state.focusBehaviorTeardown?.();
	state.focusBehaviorTeardown = null;

	state.lastActiveElementTracer.disconnect();

	for (const [target, type, listener, options] of eventListeners) {
		target.removeEventListener(type, listener, options);
	}
	eventListeners.length = 0;
}

test.beforeEach(clearState);
test.afterEach.always(clearState);
