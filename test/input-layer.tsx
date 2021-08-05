import test from "ava";
import { InputLayer, InputLayerCreateEvent } from "../src";
import { state } from "../src/state";
import { attach, createElement } from "./_utility/html";

test.serial("create & dispose", t => {
	const rootA = attach(t, <div />);
	const rootB = attach(t, <div />);

	t.deepEqual(state.inputLayerRoots, []);
	t.is(InputLayer.current, document.body);

	const a = InputLayer.create(rootA);
	t.true(a.current);
	t.deepEqual(state.inputLayerRoots, [rootA]);
	t.is(InputLayer.current, rootA);

	const b = InputLayer.create(rootB);
	t.false(a.current);
	t.true(b.current);
	t.deepEqual(state.inputLayerRoots, [rootA, rootB]);
	t.is(InputLayer.current, rootB);

	a.dispose();
	t.false(a.current);
	t.true(b.current);
	t.deepEqual(state.inputLayerRoots, [rootB]);
	t.is(InputLayer.current, rootB);

	a.dispose();
	t.deepEqual(state.inputLayerRoots, [rootB]);
	t.is(InputLayer.current, rootB);

	b.dispose();
	t.false(b.current);
	t.deepEqual(state.inputLayerRoots, []);
	t.is(InputLayer.current, document.body);
});

test.serial("disallow multiple layers per root", t => {
	const root = attach(t, <div />);
	const a = InputLayer.create(root);
	t.deepEqual(state.inputLayerRoots, [root]);

	t.throws(() => InputLayer.create(root));
	t.deepEqual(state.inputLayerRoots, [root]);

	a.dispose();
	t.deepEqual(state.inputLayerRoots, []);

	const b = InputLayer.create(root);
	t.deepEqual(state.inputLayerRoots, [root]);
	t.not(a, b);
});

test.serial("blur & reference last active element", t => {
	const button = attach(t, <button />);
	button.focus();

	const layer = InputLayer.create(attach(t, <div />));
	t.is(layer.lastActiveElement, button);
});

test.serial("emits create event by default", async t => {
	const root = attach(t, <div />);

	let event!: CustomEvent<InputLayer>;
	root.addEventListener(InputLayer.CREATE_EVENT, ((e: InputLayerCreateEvent) => {
		event = e;
	}) as EventListener);

	const layer = InputLayer.create(root);

	t.true(event instanceof CustomEvent);
	t.false(event.bubbles);
	t.is(event.target, root);
	t.is(event.detail, layer);
});

test.serial("disable create event", t => {
	const root = attach(t, <div />);
	root.addEventListener(InputLayer.CREATE_EVENT, () => t.fail());
	InputLayer.create(root, { notify: false });
	t.pass();
});

test.serial("event listeners", t => {
	const root = attach(t, <div />);
	const layer = InputLayer.create(root);

	const other = attach(t, <div />);

	let events = 0;
	const listener = () => events++;
	layer.addEventListener("mousedown", listener);
	layer.addEventListener("mousedown", listener);

	other.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	other.dispatchEvent(new MouseEvent("mousedown"));

	t.is(events, 1);
	other.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	t.is(events, 2);

	layer.removeEventListener("mousedown", listener);
	layer.removeEventListener("mousedown", listener);
	other.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	t.is(events, 2);

	layer.addEventListener("mousedown", listener, { capture: true });
	other.dispatchEvent(new MouseEvent("mousedown"));
	t.is(events, 3);

	layer.dispose();
	other.dispatchEvent(new MouseEvent("mousedown"));
	t.is(events, 3);
});

test.serial("disable event listeners when not the current layer", t => {
	const rootA = attach(t, <div />);
	const rootB = attach(t, <div />);

	const layerA = InputLayer.create(rootA);

	let events = 0;
	layerA.addEventListener("mousedown", () => events++);

	window.dispatchEvent(new MouseEvent("mousedown"));
	t.is(events, 1);

	const layerB = InputLayer.create(rootB);
	window.dispatchEvent(new MouseEvent("mousedown"));
	t.is(events, 1);

	layerB.dispose();
	window.dispatchEvent(new MouseEvent("mousedown"));
	t.is(events, 2);
});

test.serial("ignores removing non attached event listener", t => {
	const root = attach(t, <div />);
	const layer = InputLayer.create(root);
	layer.removeEventListener("mousedown", () => {}, { capture: true });
	layer.removeEventListener("mousedown", () => {}, { capture: false });
	t.pass();
});

test.serial("manage internal event non capturing listener attachments", t => {
	const root = attach(t, <div />);
	const layer = InputLayer.create(root);
	const listenerA = () => {};
	const listenerB = () => {};

	layer.addEventListener("mousedown", listenerA);
	layer.addEventListener("mouseup", listenerA);
	layer.addEventListener("mouseup", listenerB);

	const wrapperA = layer["_eventListenerWrappers"].get(listenerA)!;
	t.true(layer["_nonCaptureEventAttachments"].get("mousedown")?.has(wrapperA));
	t.true(layer["_nonCaptureEventAttachments"].get("mouseup")?.has(wrapperA));

	layer.removeEventListener("mouseup", listenerA);
	t.false(layer["_nonCaptureEventAttachments"].get("mouseup")?.has(wrapperA));

	layer.removeEventListener("mouseup", listenerB, { capture: false });
	t.false(layer["_nonCaptureEventAttachments"].has("mouseup"));
});

test.serial("manage internal event capturing listener attachments", t => {
	const root = attach(t, <div />);
	const layer = InputLayer.create(root);
	const listenerA = () => {};
	const listenerB = () => {};

	layer.addEventListener("mousedown", listenerA, { capture: true });
	layer.addEventListener("mouseup", listenerA, { capture: true });
	layer.addEventListener("mouseup", listenerB, { capture: true });

	const wrapperA = layer["_eventListenerWrappers"].get(listenerA)!;
	t.true(layer["_captureEventAttachments"].get("mousedown")?.has(wrapperA));
	t.true(layer["_captureEventAttachments"].get("mouseup")?.has(wrapperA));

	layer.removeEventListener("mouseup", listenerA, { capture: true });
	t.false(layer["_captureEventAttachments"].get("mouseup")?.has(wrapperA));

	layer.removeEventListener("mouseup", listenerB, { capture: true });
	t.false(layer["_captureEventAttachments"].has("mouseup"));
});

test.serial("remove event listeners when disposed", t => {
	const root = attach(t, <div />);
	const layer = InputLayer.create(root);

	let captureEvents = 0;
	let nonCaptureEvents = 0;
	layer.addEventListener("mousedown", () => captureEvents++, { capture: true });
	layer.addEventListener("mousedown", () => nonCaptureEvents++, { capture: false });

	window.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	t.is(captureEvents, 1);
	t.is(nonCaptureEvents, 1);

	layer.dispose();

	root.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
	t.is(captureEvents, 1);
	t.is(nonCaptureEvents, 1);
});
