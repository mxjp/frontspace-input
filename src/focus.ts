import { isElementVisible } from "./visibility";

/**
 * Check if the specified node can be focused by the following conditions:
 * + node is an HTMLElement.
 * + node has a tab index greater or equal to 0 (this includes buttons, inputs, anchors etc...)
 * + node is visible in the document.
 * + node is not disabled.
 *
 * @see isElementVisible
 */
export function isFocusable(node: Node): node is HTMLElement {
	return node instanceof HTMLElement
		&& node.tabIndex >= 0
		&& isElementVisible(node)
		&& !(node as any).disabled;
}

/**
 * Check if focusing a focusable node would be unpreferred as in the following cases:
 * + node is an unchecked `<input type="radio">` with at least one other checked radio input in it's group.
 *
 * Note that the behavior of this function is not defined by design if the provided node is not focusable.
 *
 * @example
 * ```ts
 * if (isFocusable(node) && !isFocusUnpreferred(node)) {
 *   node.focus();
 * }
 * ```
 */
export function isFocusUnpreferred(node: Node) {
	if (node instanceof HTMLInputElement && node.type === "radio" && !node.checked) {
		const group = document.getElementsByName(node.name);
		if (group.length > 1) {
			for (let i = 0; i < group.length; i++) {
				const item = group.item(i);
				if (item instanceof HTMLInputElement && item.checked && !item.disabled) {
					return true;
				}
			}
		}
	}
	return false;
}

/**
 * Create a tree walker that filters for focusable nodes.
 *
 * @param root The root node for the tree walker.
 * @param includeUnpreferred If true, unpreferrable focusable elements are included. Default is false.
 *
 * @see isFocusable
 * @see isFocusUnpreferred
 */
export function createFocusableElementsWalker(root: Node, includeUnpreferred = false) {
	return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
		acceptNode(node) {
			/* istanbul ignore else */
			if (node instanceof HTMLElement) {
				if (!isElementVisible(node) || (node as any).disabled) {
					return NodeFilter.FILTER_REJECT;
				}

				if (node.tabIndex >= 0) {
					if (!includeUnpreferred && isFocusUnpreferred(node)) {
						return NodeFilter.FILTER_REJECT;
					}

					return NodeFilter.FILTER_ACCEPT;
				}
			}
			return NodeFilter.FILTER_SKIP;
		}
	}) as FocusableElementsWalker;
}

export interface FocusableElementsWalker extends TreeWalker {
    firstChild(): HTMLElement | null;
    lastChild(): HTMLElement | null;
    nextNode(): HTMLElement | null;
    nextSibling(): HTMLElement | null;
    parentNode(): HTMLElement | null;
    previousNode(): HTMLElement | null;
    previousSibling(): HTMLElement | null;
}
