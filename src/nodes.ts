
/**
 * Check if root is or contains the node.
 */
export function isOrContains(root: Node, node: Node) {
	return root === node || Boolean(root.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

export type InputTarget = HTMLElement | SVGElement;

/**
 * Check if the node is of a type that can directly receive input when focused.
 */
export function isInputTarget(node: any): node is InputTarget {
	return node instanceof HTMLElement
		|| node instanceof SVGElement;
}
