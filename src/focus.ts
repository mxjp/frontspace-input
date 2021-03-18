import { InputLayer } from "./input-layer";
import { getInputType, INPUT_KEYBOARD } from "./input-type";
import { InputTarget, isInputTarget, isOrContains } from "./nodes";
import { state } from "./state";
import { isElementVisible } from "./visibility";

/**
 * Check if the specified node can be focused by the following conditions:
 * + node is an HTMLElement or SVGElement.
 * + node has a tab index greater or equal to 0 (this includes buttons, inputs, anchors etc...)
 * + node is visible in the document (See {@see isElementVisible}).
 * + node is not disabled.
 *
 * @see isElementVisible
 */
export function isFocusable(node: Node | null | undefined): node is InputTarget {
	return isInputTarget(node)
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
 * Restore focus on a node that was previously focused if:
 * + The current input type is {@see INPUT_KEYBOARD}.
 * + There is no other active element.
 * + The node {@see isFocusable}.
 * + The current input layer is or contains the node.
 *
 * @returns `true` if the node has been focused.
 */
export function restoreFocus(node: Node | null | undefined) {
	if (getInputType() === INPUT_KEYBOARD
		&& (!document.activeElement || document.activeElement === document.body)
		&& isFocusable(node)
		&& isOrContains(InputLayer.current, node)) {

		node.focus();
		return true;
	}
	return false;
}

/**
 * Focus the next element in the current {@see InputLayer}.
 *
 * If focus cycling is enabled and there is no next element to focus, the first element in the current {@see InputLayer} is focused.
 *
 * @returns `true` if an element has been focused.
 */
export function focusNext() {
	const layer = InputLayer.current;
	const walker = createFocusableElementsWalker(layer);

	const activeElement = document.activeElement;
	if (activeElement && activeElement !== document.body && isOrContains(layer, activeElement)) {
		walker.currentNode = activeElement;
	} else if (isFocusable(layer) && !isFocusUnpreferred(layer)) {
		layer.focus();
		return true;
	} else {
		const { target, previousSibling } = state.lastActiveElementTracer;
		if (target && isOrContains(layer, target)) {
			if (isFocusable(target) && !isFocusUnpreferred(target)) {
				target.focus();
				return true;
			}
			walker.currentNode = target;
		} else if (previousSibling && isOrContains(layer, previousSibling)) {
			walker.currentNode = previousSibling;
		}
	}

	const target = walker.root === walker.currentNode ? walker.firstChild() : walker.nextNode();
	if (target) {
		target.focus();
		return true;
	} else if (state.cycleFocus) {
		walker.currentNode = walker.root;
		const first = walker.firstChild();
		if (first) {
			first.focus();
			return true;
		}
	}

	return false;
}

/**
 * Focus the previous element in the current {@see InputLayer}.
 *
 * If focus cycling is enabled and there is no previous element to focus, the last element in the current {@see InputLayer} is focused instead.
 *
 * @returns `true` if an element has been focused.
 */
export function focusPrevious() {
	const layer = InputLayer.current;
	const walker = createFocusableElementsWalker(layer);

	const activeElement = document.activeElement;
	if (activeElement && activeElement !== document.body && isOrContains(layer, activeElement)) {
		walker.currentNode = activeElement;
	} else if (isFocusable(layer) && !isFocusUnpreferred(layer)) {
		layer.focus();
		return true;
	} else {
		const { target, nextSibling } = state.lastActiveElementTracer;
		if (target && isOrContains(layer, target)) {
			if (isFocusable(target) && !isFocusUnpreferred(target)) {
				target.focus();
				return true;
			}
			walker.currentNode = target;
		} else if (nextSibling && isOrContains(layer, nextSibling)) {
			walker.currentNode = nextSibling;
		}
	}

	const target = walker.root === walker.currentNode ? walker.lastChild() : walker.previousNode();
	if (target) {
		target.focus();
		return true;
	} else if (state.cycleFocus) {
		walker.currentNode = walker.root;
		const last = walker.lastChild();
		if (last) {
			last.focus();
			return true;
		}
	}

	return false;
}

export interface FocusBehaviorOptions {
	/**
	 * When `true`, the browsers default focus behavior is overwritten.
	 *
	 * @default true but behavior is not overwritten when {@see setupFocusHandling} has not been called.
	 */
	enable?: boolean;

	/**
	 * `true` to enable focus cycling as described in {@see focusNext} and {@see focusPrevious}.
	 *
	 * @default false
	 */
	cycleFocus?: boolean;

	/**
	 * `true` to approximate the position of the last active element using a {@see NodeTracer} if it has been removed and the previous or next element is focused.
	 *
	 * @default true
	 */
	trackLastActiveElement?: boolean;

	/**
	 * `true` to prevent elements outside of the current {@see InputLayer} to be focused by the user or programmatically.
	 *
	 * @default true
	 */
	preventInvalidFocus?: boolean;
}

/**
 * Setup the focus behavior.
 */
export function setupFocusBehavior(options: FocusBehaviorOptions = {}) {
	state.focusBehaviorTeardown?.();
	state.focusBehaviorTeardown = null;

	state.cycleFocus = options.cycleFocus ?? false;

	const trackLastActiveElement = options.trackLastActiveElement ?? true;
	const preventInvalidFocus = options.preventInvalidFocus ?? true;

	if (options.enable ?? true) {
		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Tab"
				&& !event.defaultPrevented
				&& !event.altKey
				&& !event.metaKey
				&& !event.ctrlKey) {

				if (event.shiftKey) {
					focusPrevious();
				} else {
					focusNext();
				}

				event.preventDefault();
				event.stopImmediatePropagation();
			}
		}

		function onFocus(event: FocusEvent) {
			if (event.target instanceof Node) {
				state.lastActiveElementTracer.target = event.target;

				if (preventInvalidFocus && !isOrContains(InputLayer.current, event.target)) {
					event.preventDefault();
					event.stopImmediatePropagation();
					/* istanbul ignore else */
					if (isInputTarget(event.target)) {
						event.target.blur();
					}
				}
			}
		}

		if (trackLastActiveElement) {
			window.addEventListener("focus", onFocus, { capture: true, passive: !preventInvalidFocus });
		}

		window.addEventListener("keydown", onKeyDown);

		state.focusBehaviorTeardown = () => {
			window.removeEventListener("keydown", onKeyDown);
			if (trackLastActiveElement) {
				window.removeEventListener("focus", onFocus, { capture: true });
			}
		};
	}
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
			if (isInputTarget(node)) {
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
    firstChild(): InputTarget | null;
    lastChild(): InputTarget | null;
    nextNode(): InputTarget | null;
    nextSibling(): InputTarget | null;
    parentNode(): InputTarget | null;
    previousNode(): InputTarget | null;
    previousSibling(): InputTarget | null;
}
