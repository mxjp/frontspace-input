import { state } from "./state";

/**
 * Create a detached link.
 *
 * This will throw an error if a link for the same container to another anchor already exists.
 */
export function createDetachedLink(anchor: Element, container: Element) {
	const existingAnchor = state.detachedContainers.get(container);
	if (existingAnchor === undefined) {
		state.detachedContainers.set(container, anchor);
		state.detachedAnchors.set(anchor, (state.detachedAnchors.get(anchor) ?? 0) + 1);
	} else if (existingAnchor !== anchor) {
		throw new Error("container can only be linked to one anchor");
	}
}

/**
 * Remove a detached link.
 */
export function removeDetachedLink(container: Element) {
	const existingAnchor = state.detachedContainers.get(container);
	if (existingAnchor) {
		state.detachedContainers.delete(container);
		const containerCount = state.detachedAnchors.get(existingAnchor)!;
		if (containerCount > 1) {
			state.detachedAnchors.set(existingAnchor, containerCount - 1);
		} else {
			state.detachedAnchors.delete(existingAnchor);
		}
	}
}

/**
 * Check if an element is outside of the specified anchor, container or any nested anchors or containers.
 *
 * If `anchorOrContainer` is not linked, this will always return true.
 */
export function isForeignElement(element: Element, anchorOrContainer: Element) {
	let anchor = closestAnchor(element);
	for (;;) {
		if (anchor === anchorOrContainer) {
			return false;
		}
		let link = closestContainerLink(anchor || element);
		if (link) {
			if (link.container === anchorOrContainer) {
				return false;
			}
			anchor = link.anchor;
		} else {
			return true;
		}
	}
}

/**
 * Check if an event originated from outside of the specified anchor, container or any nested anchors or containers.
 *
 * If the event target is not an element, this will return undefined. Otherwise this will always return true if `anchorOrContainer` is not linked.
 */
export function isForeignEvent(event: Event, anchorOrContainer: Element) {
	if (event.target instanceof Element) {
		return isForeignElement(event.target, anchorOrContainer);
	}
}

function closestAnchor(element: Element | null | undefined) {
	while (element) {
		if (state.detachedAnchors.has(element)) {
			return element;
		}
		element = element.parentElement;
	}
}

function closestContainerLink(element: Element | null | undefined): ContainerLink | undefined {
	while (element) {
		const anchor = state.detachedContainers.get(element);
		if (anchor) {
			return { container: element, anchor };
		}
		element = element.parentElement;
	}
}

interface ContainerLink {
	container: Element;
	anchor: Element;
}
