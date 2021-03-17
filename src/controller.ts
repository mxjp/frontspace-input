import { createFocusableElementsWalker, isFocusable, isFocusUnpreferred } from "./focus";
import { NodeTracer } from "./node-tracer";

export interface ControllerOptions {
	overwriteFocusBehavior?: boolean;
	keyboardEvents?: string[];
	nonKeyboardEvents?: string[];
	keyboardInputAttribute?: boolean;
	nodeOfInterestEvents?: string[];
	nodeOfInterestTracing?: boolean;
	cycleFocus?: boolean;
}

/**
 * @deprecated
 */
export class Controller {
	private readonly _overwriteFocusBehavior: boolean;
	private readonly _keyboardEvents: string[];
	private readonly _nonKeyboardEvents: string[];
	private readonly _keyboardInputAttribute: boolean;
	private readonly _nodeOfInterestEvents: string[];
	private readonly _nodeOfInterestTracer: NodeTracer | null;
	private readonly _cycleFocus: boolean;

	private readonly _inputLayers: Element[] = [];
	private _isKeyboardInput = false;

	public constructor(options: ControllerOptions = {}) {
		this._overwriteFocusBehavior = options.overwriteFocusBehavior ?? true;
		this._keyboardEvents = options.keyboardEvents ?? ["keydown"];
		this._nonKeyboardEvents = options.nonKeyboardEvents ?? ["mousedown", "touchstart"];
		this._keyboardInputAttribute = options.keyboardInputAttribute ?? true;
		this._nodeOfInterestEvents = options.nodeOfInterestEvents ?? ["focus", "mousedown", "touchstart"];
		this._nodeOfInterestTracer = (options.nodeOfInterestTracing ?? true) ? new NodeTracer() : null;
		this._cycleFocus = options.cycleFocus ?? true;

		window.addEventListener("keydown", this._onKeyDown);
		for (const event of this._keyboardEvents) {
			window.addEventListener(event, this._onKeyboardInputCapture, { capture: true, passive: true });
		}
		for (const event of this._nonKeyboardEvents) {
			window.addEventListener(event, this._onNonKeyboardInputCapture, { capture: true, passive: true });
		}
		for (const event of this._nodeOfInterestEvents) {
			window.addEventListener(event, this._onNodeOfInterestEventCapture, { capture: true, passive: true });
		}
	}

	public get nodeOfInterestTracer() {
		return this._nodeOfInterestTracer;
	}

	public get inputLayer() {
		return this._inputLayers[this._inputLayers.length - 1] || document.body;
	}

	public get isKeyboardInput() {
		return this._isKeyboardInput;
	}

	public set isKeyboardInput(value: boolean) {
		value = Boolean(value);
		if (this._isKeyboardInput !== value) {
			this._isKeyboardInput = value;
			if (this._keyboardInputAttribute) {
				if (value) {
					document.body.dataset.keyboardInput = "";
				} else {
					delete document.body.dataset.keyboardInput;
				}
			}
		}
	}

	public focusNext() {
		const layer = this.inputLayer;
		const walker = createFocusableElementsWalker(layer);

		const activeElement = document.activeElement;
		if (activeElement && activeElement !== document.body && isOrContains(layer, activeElement)) {
			walker.currentNode = activeElement;
		} else if (this._nodeOfInterestTracer !== null) {
			const { target, previousSibling } = this._nodeOfInterestTracer;
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

		const target = walker.nextNode();
		if (target) {
			target.focus();
			return true;
		} else if (this._cycleFocus) {
			walker.currentNode = walker.root;
			const first = walker.firstChild();
			if (first) {
				first.focus();
				return true;
			}
		}

		return false;
	}

	public focusPrevious() {
		const layer = this.inputLayer;
		const walker = createFocusableElementsWalker(layer);

		const activeElement = document.activeElement;
		if (activeElement && activeElement !== document.body && isOrContains(layer, activeElement)) {
			walker.currentNode = activeElement;
		} else if (this._nodeOfInterestTracer !== null) {
			const { target, nextSibling } = this._nodeOfInterestTracer;
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

		const target = walker.previousNode();
		if (target) {
			target.focus();
			return true;
		} else if (this._cycleFocus) {
			walker.currentNode = walker.root;
			const last = walker.lastChild();
			if (last) {
				last.focus();
				return true;
			}
		}

		return false;
	}

	public restoreFocus(target: Node) {
		if (this.isKeyboardInput
			&& (!document.activeElement || document.activeElement === document.body)
			&& isFocusable(target)
			&& isOrContains(this.inputLayer, target)) {

			target.focus();
			return true;
		}
		return false;
	}

	public createInputLayer(root: Element): InputLayer {
		if (this._inputLayers.includes(root)) {
			throw new Error("another input layer exists for the same root element");
		}

		this._inputLayers.push(root);
		this.setNodeOfInterest(root);

		let lastActiveElement: HTMLElement | null = null;
		if (document.activeElement instanceof HTMLElement
			&& !isOrContains(root, document.activeElement)
			&& document.activeElement !== document.body) {

			lastActiveElement = document.activeElement;
			document.activeElement.blur();
		}

		return {
			lastActiveElement,
			dispose: () => {
				const index = this._inputLayers.indexOf(root);
				if (index >= 0) {
					this._inputLayers.splice(index, 1);
				}
			}
		};
	}

	public dispose() {
		window.removeEventListener("keydown", this._onKeyDown);
		for (const event of this._keyboardEvents) {
			window.removeEventListener(event, this._onKeyboardInputCapture, { capture: true });
		}
		for (const event of this._nonKeyboardEvents) {
			window.removeEventListener(event, this._onNonKeyboardInputCapture, { capture: true });
		}
		for (const event of this._nodeOfInterestEvents) {
			window.removeEventListener(event, this._onNodeOfInterestEventCapture, { capture: true });
		}
		this.isKeyboardInput = false;
		if (this._nodeOfInterestTracer !== null) {
			this._nodeOfInterestTracer.disconnect();
		}
	}

	protected setNodeOfInterest(node: Node | null) {
		if (this._nodeOfInterestTracer !== null && (node === null || isOrContains(this.inputLayer, node))) {
			this._nodeOfInterestTracer.target = node;
		}
	}

	private _onKeyDown = (event: KeyboardEvent) => {
		if (this._overwriteFocusBehavior
			&& event.key === "Tab"
			&& !event.defaultPrevented
			&& !event.altKey
			&& !event.metaKey
			&& !event.ctrlKey) {

			if (event.shiftKey) {
				// TODO: Test focus previous.
				this.focusPrevious();
			} else {
				// TODO: Test focus next.
				this.focusNext();
			}

			event.preventDefault();
			event.stopPropagation();
			return;
		}
	};

	private _onKeyboardInputCapture = () => {
		this.isKeyboardInput = true;
	};

	private _onNonKeyboardInputCapture = () => {
		this.isKeyboardInput = false;
	};

	private _onNodeOfInterestEventCapture = (event: Event) => {
		if ((event.target instanceof Node) && isOrContains(this.inputLayer, event.target)) {
			this.setNodeOfInterest(event.target);
		}
	};
}

export interface InputLayer {
	lastActiveElement: HTMLElement | null;
	dispose(): void;
}

function isOrContains(root: Node, node: Node) {
	return root === node || Boolean(root.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY);
}
