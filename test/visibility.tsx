import test from "ava";
import { isElementVisible } from "../src/visibility";
import { attach, createElement } from "./_utility/html";

test("isElementVisible: detached element", t => {
	let element: HTMLElement = null!;
	<div ref={v => element = v}></div>;
	t.false(isElementVisible(element));
});

test("isElementVisible: detached nested element", t => {
	let element: HTMLElement = null!;
	<div>
		<div ref={v => element = v}></div>
	</div>;
	t.false(isElementVisible(element));
});

test("isElementVisible: nested element", t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test("isElementVisible: nested element with display=none", t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="display: none;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: nested element with hidden attribute", t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div hidden ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: nested element with parent display=none", t => {
	let element: HTMLElement = null!;
	attach(t, <div style="display: none;">
		<div ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: nested element with parent hidden attribute", t => {
	let element: HTMLElement = null!;
	attach(t, <div hidden>
		<div ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: element with position=fixed", t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="position: fixed;" ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test("isElementVisible: element with position=fixed with parent display=none", t => {
	let element: HTMLElement = null!;
	attach(t, <div style="display: none;">
		<div style="position: fixed;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: element with position=fixed & display=none", t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<div style="position: fixed; display: none;" ref={v => element = v}></div>
	</div>);
	t.false(isElementVisible(element));
});

test("isElementVisible: detached element with position=fixed", t => {
	let element: HTMLElement = null!;
	<div style="position: fixed;" ref={v => element = v}></div>;
	t.false(isElementVisible(element));
});

test("isElementVisible: parent element with position=fixed", t => {
	let element: HTMLElement = null!;
	attach(t, <div style="position: fixed;">
		<div ref={v => element = v}></div>
	</div>);
	t.true(isElementVisible(element));
});

test("isElementVisible: body element", t => {
	t.true(isElementVisible(document.body));
});

test("isElementVisible: body element with display=none", t => {
	t.teardown(() => document.body.removeAttribute("style"));
	document.body.style.display = "none";
	t.false(isElementVisible(document.body));
});

test("isElementVisible: root element", t => {
	t.true(isElementVisible(document.documentElement));
});

test("isElementVisible: root element with display=none", t => {
	t.teardown(() => document.documentElement.removeAttribute("style"));
	document.documentElement.style.display = "none";
	t.false(isElementVisible(document.documentElement));
});
