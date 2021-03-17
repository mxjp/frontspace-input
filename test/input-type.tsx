import test from "ava";
import { getInputType, InputType, setupInputDetection } from "../src";
import { state } from "../src/state";
import { attach, createElement } from "./_utility/html";

const inputTypes = new Map<InputType, string[]>([
	["none", []],
	["keyboard", ["keydown"]],
	["mouse", ["mousedown"]],
	["touch", ["touchstart"]]
]);

test.afterEach(() => {
	state.inputDetectionTeardown?.();
	state.inputType = "none";
	delete document.documentElement.dataset.inputType;
});

test.before(t => {
	t.is(getInputType(), "none");
	t.is(state.inputDetectionTeardown, null);
});

for (const [type, events] of inputTypes) {
	for (const event of events) {
		test.serial(`detects input type "${type}" by capturing "${event}" events by default (indicator enabled)`, t => {
			setupInputDetection({ indicatorAttribute: true });
			attach(t, <div />).dispatchEvent(new CustomEvent(event));
			t.is(getInputType(), type);
			t.is(document.documentElement.dataset.inputType, type);
		});

		test.serial(`detects input type "${type}" by capturing "${event}" events by default (indicator disabled)`, t => {
			setupInputDetection();
			attach(t, <div />).dispatchEvent(new CustomEvent(event));
			t.is(getInputType(), type);
			t.is(document.documentElement.dataset.inputType, undefined);
		});
	}
}
