
export function isOrContains(root: Node, node: Node) {
	return root === node || Boolean(root.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}
