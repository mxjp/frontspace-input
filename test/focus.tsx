import test from "ava";
import { attach, createElement } from "./_utility/html";
import { createFocusableElementsWalker, isFocusable, isFocusUnpreferred } from "../src/focus";

test(`${isFocusable.name}: text node`, t => {
	let element: HTMLElement = null!;
	attach(t, <div ref={v => element = v}>test</div>);
	t.false(isFocusable(element.childNodes.item(0)));
});

test(`${isFocusable.name}: regular element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div ref={v => element = v} />);
	t.false(isFocusable(element));
});

test(`${isFocusable.name}: a element`, t => {
	let element: HTMLElement = null!;
	attach(t, <a ref={v => element = v} />);
	t.true(isFocusable(element));
});

test(`${isFocusable.name}: button element`, t => {
	let element: HTMLElement = null!;
	attach(t, <button ref={v => element = v} />);
	t.true(isFocusable(element));
});

test(`${isFocusable.name}: input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <input ref={v => element = v} />);
	t.true(isFocusable(element));
});

test(`${isFocusable.name}: select element`, t => {
	let element: HTMLElement = null!;
	attach(t, <select ref={v => element = v} />);
	t.true(isFocusable(element));
});

test(`${isFocusable.name}: textarea element`, t => {
	let element: HTMLElement = null!;
	attach(t, <textarea ref={v => element = v} />);
	t.true(isFocusable(element));
});

test(`${isFocusable.name}: invisible element`, t => {
	t.false(isFocusable(<input />));
});

test(`${isFocusable.name}: disabled input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <input ref={v => element = v} disabled />);
	t.false(isFocusable(element));
});

test(`${isFocusUnpreferred.name}: text input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="text" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: single radio input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: single checked radio input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="radio" name="test" checked />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: multiple radio input elements`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: multiple radio input elements with one other checked`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" checked />
	</div>);
	t.true(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: multiple radio input elements with one other disabled checked`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" checked disabled />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${isFocusUnpreferred.name}: multiple radio input elements with one checked target`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" checked />
		<input type="radio" name="test" />
		<input type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test(`${createFocusableElementsWalker.name}`, t => {
	const elements: HTMLElement[] = [];
	attach(t, <div>
		<input ref={v => elements.push(v)} />
		<input disabled />
		<input style="display: none;" />
		<div style="display: none;">
			<input />
		</div>
		<div>
			<input type="radio" name="test" />
			<input type="radio" name="test" ref={v => elements.push(v)} checked />
			<input type="radio" name="test" />
		</div>
		<div>
			<input ref={v => elements.push(v)} />
		</div>
	</div>);

	const walker = createFocusableElementsWalker(document.body);
	while (walker.nextNode()) {
		t.is(walker.currentNode, elements.shift());
	}
	t.is(elements.length, 0);
});

test(`${createFocusableElementsWalker.name} include unpreferred`, t => {
	const elements: HTMLElement[] = [];
	attach(t, <div>
		<input type="radio" name="test" ref={v => elements.push(v)} />
		<input type="radio" name="test" ref={v => elements.push(v)} checked />
		<input type="radio" name="test" ref={v => elements.push(v)} />
	</div>);

	const walker = createFocusableElementsWalker(document.body, true);
	while (walker.nextNode()) {
		t.is(walker.currentNode, elements.shift());
	}
	t.is(elements.length, 0);
});
