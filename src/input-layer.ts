import { isOrContains } from "./nodes";
import { state } from "./state";

/**
 * An input layer represents a part of the document
 * that keyboard interaction is limited too.
 */
export class InputLayer {
	/**
	 * The root node of this input layer.
	 */
	public readonly root: Node;

	/**
	 * An element outside of this input layer that was focused while this input layer was created. This should be used to restore focus after this input layer is disposed.
	 *
	 * @example
	 * ```ts
	 * layer.dispose();
	 * restoreFocus(layer.lastActiveElement);
	 * ```
	 */
	public readonly lastActiveElement: HTMLElement | null;

	private _disposed = false;

	private constructor(root: Node, lastActiveElement: HTMLElement | null) {
		this.root = root;
		this.lastActiveElement = lastActiveElement;
	}

	/**
	 * Remove this input layer from the stack.
	 */
	public dispose() {
		if (!this._disposed) {
			const index = state.inputLayerRoots.indexOf(this.root);
			/* istanbul ignore else */
			if (index >= 0) {
				state.inputLayerRoots.splice(index, 1);
			}
			this._disposed = true;
		}
	}

	/**
	 * Get the root node of the current input layer. If there is no input layer, this returns the document body.
	 */
	public static get current() {
		const count = state.inputLayerRoots.length;
		return count > 0 ? state.inputLayerRoots[count - 1] : document.body;
	}

	/**
	 * Create a new input layer.
	 *
	 * If an element outside of the specified root is focused, the focus is removed from that element.
	 */
	public static create(root: Node) {
		if (state.inputLayerRoots.includes(root)) {
			throw new Error("input layer already exists for the specified root node");
		}

		state.inputLayerRoots.push(root);

		let lastActiveElement: HTMLElement | null = null;
		if (document.activeElement instanceof HTMLElement
			&& !isOrContains(root, document.activeElement)
			&& document.activeElement !== document.body) {

			lastActiveElement = document.activeElement;
			document.activeElement.blur();
		}

		return new InputLayer(root, lastActiveElement);
	}
}
