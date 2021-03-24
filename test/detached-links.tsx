import test from "ava";
import { createDetachedLink, isForeignElement, isForeignEvent, removeDetachedLink } from "../src";
import { state } from "../src/state";
import { createElement, attach } from "./_utility/html";

test(`${createDetachedLink.name} & ${removeDetachedLink.name}`, t => {
	const anchor = attach(t, <div />);
	const containerA = attach(t, <div />);
	const containerB = attach(t, <div />);

	createDetachedLink(anchor, containerA);
	t.is(state.detachedAnchors.get(anchor), 1);
	t.is(state.detachedContainers.get(containerA), anchor);

	createDetachedLink(anchor, containerB);
	t.is(state.detachedAnchors.get(anchor), 2);
	t.is(state.detachedContainers.get(containerB), anchor);
	createDetachedLink(anchor, containerB);
	t.is(state.detachedAnchors.get(anchor), 2);
	t.is(state.detachedContainers.get(containerB), anchor);

	t.throws(() => createDetachedLink(<div />, containerA));

	removeDetachedLink(containerA);
	t.is(state.detachedAnchors.get(anchor), 1);
	t.false(state.detachedContainers.has(containerA));
	removeDetachedLink(containerA);
	t.is(state.detachedAnchors.get(anchor), 1);
	t.false(state.detachedContainers.has(containerA));

	removeDetachedLink(containerB);
	t.false(state.detachedAnchors.has(anchor));
	t.false(state.detachedContainers.has(containerB));
	removeDetachedLink(containerB);
	t.false(state.detachedAnchors.has(anchor));
	t.false(state.detachedContainers.has(containerB));
});

test(`${isForeignElement.name}: external element`, t => {
	const anchor = attach(t, <div />);
	const container = attach(t, <div />);
	createDetachedLink(anchor, container);
	t.true(isForeignElement(attach(t, <div />), anchor));
	t.true(isForeignElement(attach(t, <div />), container));
});

test(`${isForeignElement.name}: single link`, t => {
	const anchor = attach(t, <div>
		<div />
	</div>);
	const container = attach(t, <div>
		<div />
	</div>);
	createDetachedLink(anchor, container);
	t.false(isForeignElement(anchor, anchor));
	t.false(isForeignElement(anchor.firstElementChild!, anchor));
	t.true(isForeignElement(anchor, container));
	t.true(isForeignElement(anchor.firstElementChild!, container));
	t.false(isForeignElement(container, anchor));
	t.false(isForeignElement(container.firstElementChild!, anchor));
	t.false(isForeignElement(container, container));
	t.false(isForeignElement(container.firstElementChild!, container));
});

test(`${isForeignElement.name}: nested link`, t => {
	const outerAnchor = attach(t, <div>
		<div />
	</div>);
	const outerContainer = attach(t, <div>
		<div>
			<div>
				<div />
			</div>
		</div>
	</div>);
	const innerAnchor = outerContainer.firstElementChild!.firstElementChild!;
	const innerContainer = attach(t, <div>
		<div />
	</div>);
	createDetachedLink(outerAnchor, outerContainer);
	createDetachedLink(innerAnchor, innerContainer);
	t.true(isForeignElement(outerAnchor, innerAnchor));
	t.true(isForeignElement(outerAnchor, innerContainer));
	t.true(isForeignElement(outerContainer, innerAnchor));
	t.true(isForeignElement(outerContainer, innerContainer));
	t.false(isForeignElement(innerAnchor, outerAnchor));
	t.false(isForeignElement(innerAnchor, outerContainer));
	t.false(isForeignElement(innerAnchor.firstElementChild!, outerAnchor));
	t.false(isForeignElement(innerAnchor.firstElementChild!, outerContainer));
	t.false(isForeignElement(innerContainer, outerAnchor));
	t.false(isForeignElement(innerContainer, outerContainer));
	t.false(isForeignElement(innerContainer.firstElementChild!, outerAnchor));
	t.false(isForeignElement(innerContainer.firstElementChild!, outerContainer));
});

test(`${isForeignEvent.name}: non element target`, t => {
	const anchor = attach(t, <div />);
	const container = attach(t, <div />);
	createDetachedLink(anchor, container);
	const event = new CustomEvent("test");
	t.is(isForeignEvent(event, anchor), undefined);
	t.is(isForeignEvent(event, container), undefined);
});

test(`${isForeignEvent.name}: foreign event`, t => {
	const anchor = attach(t, <div />);
	const container = attach(t, <div />);
	createDetachedLink(anchor, container);
	const event = new CustomEvent("test");
	attach(t, <div />).dispatchEvent(event);
	t.is(isForeignEvent(event, anchor), true);
	t.is(isForeignEvent(event, container), true);
});

test(`${isForeignEvent.name}: anchor event`, t => {
	const anchor = attach(t, <div />);
	const container = attach(t, <div />);
	createDetachedLink(anchor, container);
	const event = new CustomEvent("test");
	anchor.dispatchEvent(event);
	t.is(isForeignEvent(event, anchor), false);
	t.is(isForeignEvent(event, container), true);
});

test(`${isForeignEvent.name}: container event`, t => {
	const anchor = attach(t, <div />);
	const container = attach(t, <div />);
	createDetachedLink(anchor, container);
	const event = new CustomEvent("test");
	container.dispatchEvent(event);
	t.is(isForeignEvent(event, anchor), false);
	t.is(isForeignEvent(event, container), false);
});
