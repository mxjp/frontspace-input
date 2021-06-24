import test from "ava";
import { getInputType, InputType, INPUT_KEYBOARD, INPUT_MOUSE, setupInputDetection } from "../src";
import { attach, createElement } from "./_utility/html";

const inputTypes = new Map<InputType, string[]>([
	["none", []],
	["keyboard", ["keydown"]],
	["mouse", ["mousedown"]],
	["touch", ["touchstart"]]
]);

const ignoredKeys = new Set([
	"Unidentified",
	"Alt",
	"AltGr",
	"AltGraph",
	"CapsLock",
	"Control",
	"Fn",
	"FnLock",
	"Meta",
	"OS",
	"Shift",
	"Super",
	"Hyper",
	"Symbol",
	"SymbolLock"
]);

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

for (const ignoredKey of ignoredKeys) {
	test.serial(`ignores key by default: ${ignoredKey}`, t => {
		setupInputDetection();

		const host = attach(t, <div />);
		host.dispatchEvent(new MouseEvent("mousedown"));
		t.is(getInputType(), INPUT_MOUSE);

		attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: ignoredKey }));
		t.is(getInputType(), INPUT_MOUSE);

		attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
		t.is(getInputType(), INPUT_KEYBOARD);
	});
}

test.serial(`ignores custom keys`, t => {
	setupInputDetection({ ignoredKeys: ["b"] });

	const host = attach(t, <div />);
	host.dispatchEvent(new MouseEvent("mousedown"));
	t.is(getInputType(), INPUT_MOUSE);

	attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
	t.is(getInputType(), INPUT_MOUSE);

	attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
	t.is(getInputType(), INPUT_KEYBOARD);
});
