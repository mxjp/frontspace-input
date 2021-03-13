/// <reference path="./jsx.d.ts" />

export function createElement(type: string, props: Record<string, any> | null, ...children: any[]): HTMLElement {
	const element = document.createElement(type);

	for (let child of children) {
		if (!(child instanceof Node)) {
			child = document.createTextNode(String(child));
		}
		element.appendChild(child);
	}

	props?.ref?.(element);
	return element;
}
