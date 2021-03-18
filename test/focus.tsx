import test from "ava";
import { createFocusableElementsWalker, focusNext, focusPrevious, InputLayer, INPUT_KEYBOARD, isFocusable, isFocusUnpreferred, restoreFocus, setupFocusBehavior } from "../src";
import { state } from "../src/state";
import { attach, attachAfter, attachBefore, createElement } from "./_utility/html";
import { setInputType } from "./_utility/state";

test.serial(`${isFocusable.name}: text node`, t => {
	let element: HTMLElement = null!;
	attach(t, <div ref={v => element = v}>test</div>);
	t.false(isFocusable(element.childNodes.item(0)));
});

test.serial(`${isFocusable.name}: regular element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div ref={v => element = v} />);
	t.false(isFocusable(element));
});

test.serial(`${isFocusable.name}: a element`, t => {
	let element: HTMLElement = null!;
	attach(t, <a ref={v => element = v} />);
	t.true(isFocusable(element));
});

test.serial(`${isFocusable.name}: button element`, t => {
	let element: HTMLElement = null!;
	attach(t, <button ref={v => element = v} />);
	t.true(isFocusable(element));
});

test.serial(`${isFocusable.name}: input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <input ref={v => element = v} />);
	t.true(isFocusable(element));
});

test.serial(`${isFocusable.name}: select element`, t => {
	let element: HTMLElement = null!;
	attach(t, <select ref={v => element = v} />);
	t.true(isFocusable(element));
});

test.serial(`${isFocusable.name}: textarea element`, t => {
	let element: HTMLElement = null!;
	attach(t, <textarea ref={v => element = v} />);
	t.true(isFocusable(element));
});

test.serial(`${isFocusable.name}: invisible element`, t => {
	t.false(isFocusable(<input />));
});

test.serial(`${isFocusable.name}: disabled input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <input ref={v => element = v} disabled />);
	t.false(isFocusable(element));
});

test.serial(`${isFocusUnpreferred.name}: text input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="text" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: single radio input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: single checked radio input element`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input ref={v => element = v} type="radio" name="test" checked />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: multiple radio input elements`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: multiple radio input elements with one other checked`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" checked />
	</div>);
	t.true(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: multiple radio input elements with one other disabled checked`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" />
		<input type="radio" name="test" />
		<input type="radio" name="test" checked disabled />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${isFocusUnpreferred.name}: multiple radio input elements with one checked target`, t => {
	let element: HTMLElement = null!;
	attach(t, <div>
		<input type="radio" name="test" />
		<input ref={v => element = v} type="radio" name="test" checked />
		<input type="radio" name="test" />
		<input type="radio" name="test" />
	</div>);
	t.false(isFocusUnpreferred(element));
});

test.serial(`${restoreFocus.name}`, t => {
	setInputType(INPUT_KEYBOARD);
	const node = attach(t, <button />);
	t.true(restoreFocus(node));
	t.is(document.activeElement, node);
});

test.serial(`${restoreFocus.name}: no keyboard input`, t => {
	t.false(restoreFocus(attach(t, <button />)));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${restoreFocus.name}: already active element`, t => {
	setInputType(INPUT_KEYBOARD);
	const prev = attach(t, <button />);
	prev.focus();
	console.log(document.activeElement);
	t.false(restoreFocus(attach(t, <button />)));
	t.is(document.activeElement, prev);
});

test.serial(`${restoreFocus.name}: non focusable node`, t => {
	setInputType(INPUT_KEYBOARD);
	t.false(restoreFocus(attach(t, <span />)));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${restoreFocus.name}: node outside of input layer`, t => {
	setInputType(INPUT_KEYBOARD);
	const node = attach(t, <button />);
	InputLayer.create(attach(t, <div />));
	t.false(restoreFocus(node));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${focusNext.name}: start at active element`, t => {
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	a.focus();
	t.true(focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${focusNext.name}: focus layer`, t => {
	const layer = attach(t, <button />);
	InputLayer.create(layer);
	t.true(focusNext());
	t.is(document.activeElement, layer);
});

test.serial(`${focusNext.name}: focus next inside of focusable layer`, t => {
	const layer = attach(t, <button>
		<button />
		<button />
	</button>);
	InputLayer.create(layer);
	(layer.firstElementChild as HTMLElement).focus();
	t.true(focusNext());
	t.is(document.activeElement, layer.lastElementChild);
});

test.serial(`${focusNext.name}: ignore active element outside of input layer`, t => {
	const layer = attach(t, <div>
		<button />
	</div>);
	const a = attach(t, <button />);
	attach(t, <button />);
	InputLayer.create(layer);
	a.focus();
	t.is(document.activeElement, a);

	t.true(focusNext());
	t.is(document.activeElement, layer.firstElementChild);
});

test.serial(`${focusNext.name}: use last focused target`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const a = attach(t, <button />);
	attach(t, <button />);

	a.focus();
	a.blur();
	t.true(document.activeElement === null || document.activeElement === document.body);

	t.true(focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${focusNext.name}: start at last focused target`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const a = attach(t, <button />);
	const b = attach(t, <button />);

	a.focus();
	a.blur();
	t.true(document.activeElement === null || document.activeElement === document.body);
	a.tabIndex = -1;

	t.true(focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${focusNext.name}: start at last focused previous sibling`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const a = attach(t, <div />);
	const b = attach(t, <button />);
	b.focus();
	b.remove();
	t.true(document.activeElement === null || document.activeElement === document.body);

	const c = attachAfter(t, a, <button />);

	t.true(focusNext());
	t.is(document.activeElement, c);
});

test.serial(`${focusNext.name}: cycle disabled`, t => {
	setupFocusBehavior({ cycleFocus: false });
	attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.false(focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${focusNext.name}: cycle enabled`, t => {
	setupFocusBehavior({ cycleFocus: true });
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.true(focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${focusNext.name}: cycle enabled, no focusable element`, t => {
	setupFocusBehavior({ cycleFocus: true });
	t.false(focusNext());
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${focusPrevious.name}: start at active element`, t => {
	const b = attach(t, <button />);
	const a = attach(t, <button />);
	a.focus();
	t.true(focusPrevious());
	t.is(document.activeElement, b);
});

test.serial(`${focusPrevious.name}: focus layer`, t => {
	const layer = attach(t, <button />);
	InputLayer.create(layer);
	t.true(focusPrevious());
	t.is(document.activeElement, layer);
});

test.serial(`${focusPrevious.name}: focus previous inside of focusable layer`, t => {
	const layer = attach(t, <button>
		<button />
		<button />
	</button>);
	InputLayer.create(layer);
	(layer.lastElementChild as HTMLElement).focus();
	t.true(focusPrevious());
	t.is(document.activeElement, layer.firstElementChild);
});

test.serial(`${focusPrevious.name}: ignore active element outside of input layer`, t => {
	attach(t, <button />);
	const a = attach(t, <button />);
	const layer = attach(t, <div>
		<button />
	</div>);
	InputLayer.create(layer);
	a.focus();
	t.is(document.activeElement, a);

	t.true(focusPrevious());
	t.is(document.activeElement, layer.firstElementChild);
});

test.serial(`${focusPrevious.name}: use first focused target`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const a = attach(t, <button />);
	attach(t, <button />);

	a.focus();
	a.blur();
	t.true(document.activeElement === null || document.activeElement === document.body);

	t.true(focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${focusPrevious.name}: start at last focused target`, t => {
	setupFocusBehavior();
	const b = attach(t, <button />);
	const a = attach(t, <button />);
	attach(t, <button />);

	a.focus();
	a.blur();
	t.true(document.activeElement === null || document.activeElement === document.body);
	a.tabIndex = -1;

	t.true(focusPrevious());
	t.is(document.activeElement, b);
});

test.serial(`${focusPrevious.name}: start at last focused next sibling`, t => {
	setupFocusBehavior();
	const b = attach(t, <button />);
	const a = attach(t, <div />);
	attach(t, <button />);
	b.focus();
	b.remove();
	t.true(document.activeElement === null || document.activeElement === document.body);

	const c = attachBefore(t, a, <button />);

	t.true(focusPrevious());
	t.is(document.activeElement, c);
});

test.serial(`${focusPrevious.name}: cycle disabled`, t => {
	setupFocusBehavior({ cycleFocus: false });
	const b = attach(t, <button />);
	attach(t, <button />);
	b.focus();
	t.false(focusPrevious());
	t.is(document.activeElement, b);
});

test.serial(`${focusPrevious.name}: cycle enabled`, t => {
	setupFocusBehavior({ cycleFocus: true });
	const b = attach(t, <button />);
	const a = attach(t, <button />);
	b.focus();
	t.true(focusPrevious());
	t.is(document.activeElement, a);
});

test.serial(`${focusPrevious.name}: cycle enabled, no focusable element`, t => {
	setupFocusBehavior({ cycleFocus: true });
	t.false(focusPrevious());
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${setupFocusBehavior.name}: initially, focus cycle is disabled`, t => {
	attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.false(focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${setupFocusBehavior.name}: focus cycle can be enabled when focus behavior is disabled`, t => {
	setupFocusBehavior({ enable: false, cycleFocus: true });
	const a = attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.true(focusNext());
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: focus cycle disabled by default`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const b = attach(t, <button />);
	b.focus();
	t.false(focusNext());
	t.is(document.activeElement, b);
});

test.serial(`${setupFocusBehavior.name}: last active element tracking enabled by default`, t => {
	setupFocusBehavior();
	const a = attach(t, <button />);
	a.focus();
	t.is(state.lastActiveElementTracer.target, a);
});

test.serial(`${setupFocusBehavior.name}: last active element tracking disabled`, t => {
	setupFocusBehavior({ trackLastActiveElement: false });
	const a = attach(t, <button />);
	a.focus();
	t.is(state.lastActiveElementTracer.target, null);
});

test.serial(`${setupFocusBehavior.name}: last active element tracking with disabled behavior`, t => {
	setupFocusBehavior({ enable: false, trackLastActiveElement: true });
	const a = attach(t, <button />);
	a.focus();
	t.is(state.lastActiveElementTracer.target, null);
});

test.serial(`${setupFocusBehavior.name}: prevent invalid focus enabled by default`, t => {
	setupFocusBehavior();
	const a = attach(t, <button />);
	InputLayer.create(attach(t, <div />));
	a.focus();
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${setupFocusBehavior.name}: prevent invalid focus disabled`, t => {
	setupFocusBehavior({ preventInvalidFocus: false });
	const a = attach(t, <button />);
	InputLayer.create(attach(t, <div />));
	a.focus();
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: prevent invalid focus with disabled behavior`, t => {
	setupFocusBehavior({ enable: false, preventInvalidFocus: true });
	const a = attach(t, <button />);
	InputLayer.create(attach(t, <div />));
	a.focus();
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: handle tab keypress by default`, t => {
	setupFocusBehavior();
	const a = attach(t, <button />);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: handle tab keypress disabled`, t => {
	setupFocusBehavior({ enable: false });
	attach(t, <button />);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${setupFocusBehavior.name}: handle tab keypress to focus next`, t => {
	setupFocusBehavior();
	const a = attach(t, <button />);
	attach(t, <button />);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: handle shift+tab keypress to focus previous`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const b = attach(t, <button />);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true }));
	t.is(document.activeElement, b);
});

test.serial(`${setupFocusBehavior.name}: ignore tab keypress with other modifiers`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", altKey: true }));
	t.true(document.activeElement === null || document.activeElement === document.body);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", metaKey: true }));
	t.true(document.activeElement === null || document.activeElement === document.body);
	window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", ctrlKey: true }));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${setupFocusBehavior.name}: ignore tab keypress when already prevented`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	const event = new KeyboardEvent("keydown", { key: "Tab", altKey: true });
	Object.defineProperty(event, "defaultPrevented", { value: true });
	window.dispatchEvent(event);
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${setupFocusBehavior.name}: handle tab keypress bubble`, t => {
	setupFocusBehavior();
	const a = attach(t, <button />);
	attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
	t.is(document.activeElement, a);
});

test.serial(`${setupFocusBehavior.name}: ignore tab keypress without bubble`, t => {
	setupFocusBehavior();
	attach(t, <button />);
	attach(t, <div />).dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
	t.true(document.activeElement === null || document.activeElement === document.body);
});

test.serial(`${createFocusableElementsWalker.name}`, t => {
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

test.serial(`${createFocusableElementsWalker.name} include unpreferred`, t => {
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
