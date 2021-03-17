import test, { ExecutionContext } from "ava";
import { Controller, ControllerOptions } from "../src/controller";
import { createElement, attach } from "./_utility/html";
import { microtask } from "./_utility/timing";

function createController(t: ExecutionContext, options?: ControllerOptions) {
	const controller = new Controller(options);
	t.teardown(() => controller.dispose());
	return controller;
}

test.serial("keyboard input detection", t => {
	const controller = createController(t);
	t.false(controller.isKeyboardInput);
	document.body.dispatchEvent(new KeyboardEvent("keydown"));
	t.true(controller.isKeyboardInput);
	document.body.dispatchEvent(new MouseEvent("mousedown"));
	t.false(controller.isKeyboardInput);
	t.is(document.body.dataset.keyboardInput, undefined);
	document.body.dispatchEvent(new KeyboardEvent("keydown"));
	t.true(controller.isKeyboardInput);
	document.body.dispatchEvent(new MouseEvent("touchstart"));
	t.false(controller.isKeyboardInput);
});

test.serial("keyboard input indicator data attribute (enabled)", t => {
	const controller = createController(t);
	t.is(document.body.dataset.keyboardInput, undefined);
	controller.isKeyboardInput = true;
	t.is(document.body.dataset.keyboardInput, "");
	controller.isKeyboardInput = false;
	t.is(document.body.dataset.keyboardInput, undefined);
});

test.serial("keyboard input indicator data attribute (disabled)", t => {
	const controller = createController(t, { keyboardInputAttribute: false });
	t.is(document.body.dataset.keyboardInput, undefined);
	controller.isKeyboardInput = true;
	t.is(document.body.dataset.keyboardInput, undefined);
});

test.serial("keyboard input detection with custom events", t => {
	const controller = createController(t, {
		keyboardEvents: ["foo"],
		nonKeyboardEvents: ["bar"]
	});
	t.false(controller.isKeyboardInput);
	document.body.dispatchEvent(new KeyboardEvent("keydown"));
	t.false(controller.isKeyboardInput);
	document.body.dispatchEvent(new CustomEvent("foo"));
	t.true(controller.isKeyboardInput);
	document.body.dispatchEvent(new MouseEvent("mousedown"));
	t.true(controller.isKeyboardInput);
	document.body.dispatchEvent(new CustomEvent("bar"));
	t.false(controller.isKeyboardInput);
});

test.serial(`${Controller.prototype.focusNext.name}: use first element`, t => {
	const controller = createController(t);
	const a = attach(t, <button />);
	attach(t, <button />);
	t.true(controller.focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusNext.name}: start at active element`, t => {
	const controller = createController(t);
	const a = attach(t, <button />);
	a.focus();
	const b = attach(t, <button />);
	attach(t, <button />);
	t.true(controller.focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.focusNext.name}: start at node of interest`, async t => {
	const controller = createController(t);
	attach(t, <button />);
	attach(t, <div />).dispatchEvent(new MouseEvent("mousedown"));
	const b = attach(t, <button />);
	t.true(controller.focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.focusNext.name}: use first element when node of interest tracing is disabled`, async t => {
	const controller = createController(t, { nodeOfInterestTracing: false });
	const a = attach(t, <button />);
	attach(t, <div />).dispatchEvent(new MouseEvent("mousedown"));
	attach(t, <button />);
	t.true(controller.focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusNext.name}: use node of interest when focusable`, async t => {
	const controller = createController(t);
	attach(t, <button />);
	const a = attach(t, <button />);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.true(controller.focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusNext.name}: use first element when node of interest is unpreferred`, async t => {
	const controller = createController(t);
	const a = attach(t, <input type="radio" name="test" />);
	const b = attach(t, <input type="radio" name="test" checked />);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.true(controller.focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.focusNext.name}: start at previous sibling when node of interest has been removed`, async t => {
	const controller = createController(t);
	attach(t, <button />);
	attach(t, <div />);
	const nodeOfInterest = attach(t, <div />);
	nodeOfInterest.dispatchEvent(new MouseEvent("mousedown"));
	nodeOfInterest.remove();
	await microtask();
	const a = attach(t, <button />);
	t.true(controller.focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusNext.name}: start at first element when node if interest has been removed and previous sibling is outside of current layer`, async t => {
	const controller = createController(t);
	attach(t, <button />);
	attach(t, <div />);
	const layer = attach(t, <div>
		<div />
		<button></button>
	</div>);
	controller.createInputLayer(layer);
	layer.firstElementChild!.dispatchEvent(new MouseEvent("mousedown"));
	layer.firstElementChild!.remove();
	await microtask();
	t.true(controller.focusNext());
	t.is(document.activeElement, layer.firstElementChild);
});

test.serial(`${Controller.prototype.focusNext.name}: no focusable elements`, t => {
	const controller = createController(t);
	t.false(controller.focusNext());
});

test.serial(`${Controller.prototype.focusNext.name}: no focusable elements in current layer`, t => {
	const controller = createController(t);
	attach(t, <button />);
	controller.createInputLayer(attach(t, <div />));
	attach(t, <button />);
	t.false(controller.focusNext());
});

test.serial(`${Controller.prototype.focusNext.name}: use first child when last element is focused`, async t => {
	const controller = createController(t);

	const a = attach(t, <button />);
	attach(t, <button />).focus();
	await microtask();

	t.true(controller.focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusNext.name}: disabled focus cycle`, async t => {
	const controller = createController(t, { cycleFocus: false });

	const a = attach(t, <button />);
	attach(t, <button />).focus();
	await microtask();

	t.false(controller.focusNext());
});

test.serial(`${Controller.prototype.focusPrevious.name}: use last element`, t => {
	const controller = createController(t);
	attach(t, <button />);
	const a = attach(t, <button />);
	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: start at active element`, t => {
	const controller = createController(t);
	attach(t, <button />);
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: start at node of interest`, async t => {
	const controller = createController(t);
	const b = attach(t, <button />);
	attach(t, <div />).dispatchEvent(new MouseEvent("mousedown"));
	attach(t, <button />);
	t.true(controller.focusPrevious());
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.focusPrevious.name}: use last element when node of interest tracing is disabled`, async t => {
	const controller = createController(t, { nodeOfInterestTracing: false });
	attach(t, <button />);
	attach(t, <div />).dispatchEvent(new MouseEvent("mousedown"));
	const a = attach(t, <button />);
	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: use node of interest when focusable`, async t => {
	const controller = createController(t);
	const a = attach(t, <button />);
	attach(t, <button />);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: use last element when node of interest is unpreferred`, async t => {
	const controller = createController(t);
	const b = attach(t, <input type="radio" name="test" checked />);
	const a = attach(t, <input type="radio" name="test" />);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.true(controller.focusPrevious());
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.focusPrevious.name}: start at next sibling when node of interest has been removed`, async t => {
	const controller = createController(t);
	const a = attach(t, <button />);
	const nodeOfInterest = attach(t, <div />);
	attach(t, <div />);
	attach(t, <button />);
	nodeOfInterest.dispatchEvent(new MouseEvent("mousedown"));
	nodeOfInterest.remove();
	await microtask();
	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: start at last element when node if interest has been removed and next sibling is outside of current layer`, async t => {
	const controller = createController(t);
	const layer = attach(t, <div>
		<button></button>
		<div />
	</div>);
	attach(t, <div />);
	attach(t, <button />);
	controller.createInputLayer(layer);
	layer.lastElementChild!.dispatchEvent(new MouseEvent("mousedown"));
	layer.lastElementChild!.remove();
	await microtask();
	t.true(controller.focusPrevious());
	t.is(document.activeElement, layer.lastElementChild);
});

test.serial(`${Controller.prototype.focusPrevious.name}: no focusable elements`, t => {
	const controller = createController(t);
	t.false(controller.focusPrevious());
});

test.serial(`${Controller.prototype.focusPrevious.name}: no focusable elements in current layer`, t => {
	const controller = createController(t);
	attach(t, <button />);
	controller.createInputLayer(attach(t, <div />));
	attach(t, <button />);
	t.false(controller.focusPrevious());
});

test.serial(`${Controller.prototype.focusPrevious.name}: use last child when first element is focused`, async t => {
	const controller = createController(t);

	attach(t, <button />).focus();
	const a = attach(t, <button />);
	await microtask();

	t.true(controller.focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.focusPrevious.name}: disabled focus cycle`, async t => {
	const controller = createController(t, { cycleFocus: false });

	attach(t, <button />).focus();
	const a = attach(t, <button />);
	await microtask();

	t.false(controller.focusPrevious());
});

test.serial(`${Controller.prototype.restoreFocus.name}`, t => {
	const controller = createController(t);
	controller.isKeyboardInput = true;
	const a = attach(t, <button />);
	t.true(controller.restoreFocus(a));
	t.is(document.activeElement, a);
});

test.serial(`${Controller.prototype.restoreFocus.name}: ignore if non keyboard input is used`, t => {
	const controller = createController(t);
	controller.isKeyboardInput = false;
	const a = attach(t, <button />);
	t.false(controller.restoreFocus(a));
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`${Controller.prototype.restoreFocus.name}: ignore if there is an active element`, t => {
	const controller = createController(t);
	controller.isKeyboardInput = true;
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.false(controller.restoreFocus(a));
	t.is(document.activeElement, b);
});

test.serial(`${Controller.prototype.restoreFocus.name}: ignore non focusable element`, t => {
	const controller = createController(t);
	controller.isKeyboardInput = true;
	const a = attach(t, <div />);
	t.false(controller.restoreFocus(a));
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`${Controller.prototype.restoreFocus.name}: ignore target outside of input layer`, t => {
	const controller = createController(t);
	controller.isKeyboardInput = true;
	const a = attach(t, <button />);
	controller.createInputLayer(attach(t, <div />));
	t.false(controller.restoreFocus(a));
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`${Controller.prototype.createInputLayer.name}: create & dispose`, t => {
	const controller = createController(t);
	t.is(controller.inputLayer, document.body);
	const aElem = attach(t, <div />);
	const bElem = attach(t, <div />);
	const a = controller.createInputLayer(aElem);
	t.is(controller.inputLayer, aElem);
	const b = controller.createInputLayer(bElem);
	t.is(controller.inputLayer, bElem);
	a.dispose();
	t.is(controller.inputLayer, bElem);
	b.dispose();
	t.is(controller.inputLayer, document.body);
});

test.serial(`${Controller.prototype.createInputLayer.name}: create & duplicate dispose`, t => {
	const controller = createController(t);
	t.is(controller.inputLayer, document.body);
	const aElem = attach(t, <div />);
	const bElem = attach(t, <div />);
	const a = controller.createInputLayer(aElem);
	t.is(controller.inputLayer, aElem);
	const b = controller.createInputLayer(bElem);
	t.is(controller.inputLayer, bElem);
	a.dispose();
	a.dispose();
	t.is(controller.inputLayer, bElem);
	b.dispose();
	b.dispose();
	t.is(controller.inputLayer, document.body);
});

test.serial(`${Controller.prototype.createInputLayer.name}: disallow duplicate layers`, t => {
	const controller = createController(t);
	const root = attach(t, <div />);
	const a = controller.createInputLayer(root);
	t.throws(() => controller.createInputLayer(root));
	a.dispose();
	controller.createInputLayer(root);
});

test.serial(`${Controller.prototype.createInputLayer.name}: no last active element`, t => {
	const controller = createController(t);
	const layer = controller.createInputLayer(attach(t, <div />));
	t.is(layer.lastActiveElement, null);
});

test.serial(`${Controller.prototype.createInputLayer.name}: blur last active element`, t => {
	const controller = createController(t);
	const a = attach(t, <button />);
	a.focus();
	const layer = controller.createInputLayer(attach(t, <div />));
	t.is(layer.lastActiveElement, a);
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`${Controller.prototype.createInputLayer.name}: keep active element when inside root`, t => {
	const controller = createController(t);
	const root = attach(t, <div>
		<button />
	</div>);
	(root.firstElementChild as HTMLElement).focus();
	t.is(document.activeElement, root.firstElementChild);

	const layer = controller.createInputLayer(root);
	t.is(layer.lastActiveElement, null);
	t.is(document.activeElement, root.firstElementChild);
});

test.serial(`focus next element when tab is pressed`, t => {
	createController(t);
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
	t.is(document.activeElement, a);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
	t.is(document.activeElement, b);
});

test.serial(`prevents default when tab key press is handled`, t => {
	createController(t);
	const a = attach(t, <button />);
	const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
	document.body.dispatchEvent(event);
	t.is(document.activeElement, a);
	t.true(event.defaultPrevented);
});

test.serial(`ignores tab key press when default has been prevented`, t => {
	createController(t);
	attach(t, <button />);
	const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
	event.preventDefault();
	document.body.dispatchEvent(event);
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`ignores tab key press when event does not bubble`, t => {
	createController(t);
	attach(t, <button />);
	const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: false, cancelable: true });
	document.body.dispatchEvent(event);
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`focus previous element when shift+tab is pressed`, t => {
	createController(t);
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
	t.is(document.activeElement, b);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
	t.is(document.activeElement, a);
});

test.serial(`ignores tab key press when alt, meta or ctrl is also pressed`, t => {
	createController(t);
	attach(t, <button />);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", altKey: true, bubbles: true }));
	t.true(document.activeElement === document.body || document.activeElement === null);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", metaKey: true, bubbles: true }));
	t.true(document.activeElement === document.body || document.activeElement === null);
	document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", ctrlKey: true, bubbles: true }));
	t.true(document.activeElement === document.body || document.activeElement === null);
});

test.serial(`sets node of interest on event`, t => {
	const controller = createController(t);
	const a = attach(t, <div />);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.is(controller.nodeOfInterestTracer!.target, a);
});

test.serial(`sets node of interest when input layer is created`, t => {
	const controller = createController(t);
	const a = attach(t, <div />);
	controller.createInputLayer(a);
	t.is(controller.nodeOfInterestTracer!.target, a);
});

test.serial(`ignores node of interest when outside of the current layer`, t => {
	const controller = createController(t);
	const a = attach(t, <div />);
	const b = attach(t, <div />);
	controller.createInputLayer(b);
	a.dispatchEvent(new MouseEvent("mousedown"));
	t.is(controller.nodeOfInterestTracer!.target, b);
});
