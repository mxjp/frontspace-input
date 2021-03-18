
export function isOrContains(root: Node, node: Node) {
	return root === node || Boolean(root.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

export type InputTarget = HTMLElement | SVGElement;

export function isInputTarget(node: Node | null | undefined): node is InputTarget {
	return node instanceof HTMLElement
		|| node instanceof SVGElement;
}
