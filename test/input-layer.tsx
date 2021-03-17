import test from "ava";
import { InputLayer } from "../src";
import { state } from "../src/state";
import { attach, createElement } from "./_utility/html";

test("create & dispose", t => {
	const rootA = attach(t, <div />);
	const rootB = attach(t, <div />);

	t.deepEqual(state.inputLayerRoots, []);
	t.is(InputLayer.current, document.body);

	const a = InputLayer.create(rootA);
	t.deepEqual(state.inputLayerRoots, [rootA]);
	t.is(InputLayer.current, rootA);

	const b = InputLayer.create(rootB);
	t.deepEqual(state.inputLayerRoots, [rootA, rootB]);
	t.is(InputLayer.current, rootB);

	a.dispose();
	t.deepEqual(state.inputLayerRoots, [rootB]);
	t.is(InputLayer.current, rootB);

	a.dispose();
	t.deepEqual(state.inputLayerRoots, [rootB]);
	t.is(InputLayer.current, rootB);

	b.dispose();
	t.deepEqual(state.inputLayerRoots, []);
	t.is(InputLayer.current, document.body);
});

test("disallow multiple layers per root", t => {
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

test("blur & reference last active element", t => {
	const button = attach(t, <button />);
	button.focus();

	const layer = InputLayer.create(attach(t, <div />));
	t.is(layer.lastActiveElement, button);
});
