import test from "ava";
import { INPUT_NONE } from "../../src";
import { state } from "../../src/state";

function clearState() {
	state.inputLayerRoots.length = 0;
	state.inputType = INPUT_NONE;
	state.inputDetectionTeardown?.();
	state.inputDetectionTeardown = null;

	state.cycleFocus = false;
	state.focusBehaviorTeardown?.();
	state.focusBehaviorTeardown = null;

	state.lastActiveElementTracer.disconnect();
}

test.beforeEach(clearState);
test.afterEach.always(clearState);
