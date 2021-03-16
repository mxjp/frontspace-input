import test from "ava";
import { isElementVisible } from "../src/visibility";
import { attach, createElement } from "./_utility/html";

test(`${isElementVisible.name}: detached element`, t => {
	let element: HTMLElement = null!;
	<div ref={v => element = v}></div>;
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: unconnected element`, t => {
	const element = <div />;
	// jsdom does currently not support offsetParent, so the following properties are faked.
	Object.defineProperties(element, {
		isConnected: { value: false },
		offsetParent: { value: document.body }
	});
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: connected elements`, t => {
	const element = <div />;
	// jsdom does currently not support offsetParent, so the following properties are faked.
	Object.defineProperties(element, {
		isConnected: { value: true },
		offsetParent: { value: document.body }
	});
	t.true(isElementVisible(element));
});

test(`${isElementVisible.name}: detached nested element`, t => {
	let element: HTMLElement = null!;
	<div>
		<div ref={v => element = v}></div>
	</div>;
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: nested element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test(`${isElementVisible.name}: nested element with display=none`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="display: none;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: nested element with hidden attribute`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div hidden ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: nested element with parent display=none`, t => {
	let element: HTMLElement = null!;
	attach(t, <div style="display: none;">
		<div ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: nested element with parent hidden attribute`, t => {
	let element: HTMLElement = null!;
	attach(t, <div hidden>
		<div ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: element with position=fixed`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="position: fixed;" ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test(`${isElementVisible.name}: element with position=fixed with parent display=none`, t => {
	let element: HTMLElement = null!;
	attach(t, <div style="display: none;">
		<div style="position: fixed;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: element with position=fixed & display=none`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="position: fixed; display: none;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: detached element with position=fixed`, t => {
	let element: HTMLElement = null!;
	<div style="position: fixed;" ref={v => element = v}></div>;
	t.false(isElementVisible(element));
});

test(`${isElementVisible.name}: parent element with position=fixed`, t => {
	let element: HTMLElement = null!;
	attach(t, <div style="position: fixed;">
		<div ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test(`${isElementVisible.name}: body element`, t => {
	t.true(isElementVisible(document.body));
});

test(`${isElementVisible.name}: body element with display=none`, t => {
	t.teardown(() => document.body.removeAttribute("style"));
	document.body.style.display = "none";
	t.false(isElementVisible(document.body));
});

test(`${isElementVisible.name}: root element`, t => {
	t.true(isElementVisible(document.documentElement));
});

test(`${isElementVisible.name}: root element with display=none`, t => {
	t.teardown(() => document.documentElement.removeAttribute("style"));
	document.documentElement.style.display = "none";
	t.false(isElementVisible(document.documentElement));
});
