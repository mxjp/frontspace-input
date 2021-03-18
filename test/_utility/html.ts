/// <reference path="./jsx.d.ts" />

import { ExecutionContext } from "ava";

export function createElement(type: string, props: Record<string, any> | null, ...children: any[]): HTMLElement {
	const element = document.createElement(type);

	if (props) {
		for (const prop in props) {
			if (prop !== "ref") {
				let value = props[prop];
				if (value === true) {
					value = "";
				}
				if (value !== false) {
					element.setAttribute(prop, value);
				}
			}
		}
	}

	for (let child of children) {
		if (!(child instanceof Node)) {
			child = document.createTextNode(String(child));
		}
		element.appendChild(child);
	}

	props?.ref?.(element);
	return element;
}

export function attach<T extends Node>(t: ExecutionContext, node: T) {
	t.teardown(() => node.parentNode?.removeChild(node));
	document.body.appendChild(node);
	return node;
}

export function attachAfter<T extends Node>(t: ExecutionContext, ref: Node, node: T) {
	t.teardown(() => node.parentNode?.removeChild(node));
	if (ref.nextSibling) {
		ref.parentNode!.insertBefore(node, ref.nextSibling);
	} else {
		ref.parentNode!.appendChild(node);
	}
	return node;
}

export function attachBefore<T extends Node>(t: ExecutionContext, ref: Node, node: T) {
	t.teardown(() => node.parentNode?.removeChild(node));
	ref.parentNode!.insertBefore(node, ref);
	return node;
}
