import test from "ava";
import { isElementVisible } from "../src/visibility";
import { attach, createElement } from "./_utility/html";

test.serial(`${isElementVisible.name}: element with client rects`, t => {
	t.true(isElementVisible(attach(t, <div />)));
});

test.serial(`${isElementVisible.name}: element without client rects`, t => {
	t.false(isElementVisible(<div />));
});

test.serial(`${isElementVisible.name}: non html element`, t => {
	const element = attach(t, document.createElementNS("http://www.w3.org/2000/svg", "svg"));
	Object.defineProperty(element, "getClientRects", {
		value: () => ([{}])
	});
	t.true(isElementVisible(element));
});
