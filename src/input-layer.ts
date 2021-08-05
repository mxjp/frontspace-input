import { InputTarget, isInputTarget, isOrContains } from "./nodes";
import { state } from "./state";

export interface InputLayerOptions {
	/**
	 * Notify other parts of the application by dispatching a custom "create-input-layer" event on the root element that does not bubble.
	 *
	 * The input layer instance can be accessed using `event.detail`.
	 *
	 * @default true
	 *
	 * @example
	 * ```ts
	 * window.addEventListener(InputLayer.CREATE_EVENT, ((event: InputLayerCreateEvent) => {
	 *   console.log("new InputLayer:", event.detail);
	 * }) as EventListener, { capture: true, passive: true });
	 * ```
	 */
	notify?: boolean;
}

export type InputLayerCreateEvent = CustomEvent<InputLayer>;

/**
 * An input layer represents a part of the document
 * that keyboard interaction is limited too.
 *
 * Note, that this will only work correctly, if focus behavior is enabled.
 * @see setupFocusBehavior
 */
export class InputLayer {
	public static readonly CREATE_EVENT = "create-input-layer";

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
	public readonly lastActiveElement: InputTarget | null;

	/** Map of event listeners to internal wrappers */
	private readonly _eventListenerWrappers = new WeakMap<EventListener, EventListener>();
	/** Map of event types to internal wrappers with the capture option set to true */
	private readonly _captureEventAttachments = new Map<string, Set<EventListener>>();
	/** Map of event types to internal wrappers with the capture option set to false */
	private readonly _nonCaptureEventAttachments = new Map<string, Set<EventListener>>();

	private _disposed = false;

	private constructor(root: Node, lastActiveElement: InputTarget | null) {
		this.root = root;
		this.lastActiveElement = lastActiveElement;
	}

	/**
	 * True if this is the current input layer.
	 */
	public get current() {
		return this.root === state.inputLayerRoots[state.inputLayerRoots.length - 1];
	}

	/**
	 * Add an event listener to the window object that is only called while this is the current layer.
	 *
	 * When this layer is disposed, all event listeners are detached automatically.
	 */
	public addEventListener<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
	public addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions): void;
	public addEventListener(type: string, listener: EventListener, options?: AddEventListenerOptions) {
		let wrapper = this._eventListenerWrappers.get(listener);
		if (wrapper === undefined) {
			wrapper = event => {
				if (this.current) {
					return listener(event);
				}
			};
			this._eventListenerWrappers.set(listener, wrapper);
		}
		window.addEventListener(type, wrapper, options);

		const attachmentsMap = options?.capture ? this._captureEventAttachments : this._nonCaptureEventAttachments;
		const attachments = attachmentsMap.get(type);
		if (attachments === undefined) {
			attachmentsMap.set(type, new Set([wrapper]));
		} else {
			attachments.add(wrapper);
		}
	}

	/**
	 * Remove an event listener from the window object that is only called while this is the current layer.
	 */
    public removeEventListener<K extends keyof WindowEventMap>(type: K, listener: (event: WindowEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    public removeEventListener(type: string, listener: EventListener, options?: EventListenerOptions): void;
	public removeEventListener(type: string, listener: EventListener, options?: EventListenerOptions) {
		const wrapper = this._eventListenerWrappers.get(listener);
		if (wrapper !== undefined) {
			window.removeEventListener(type, wrapper, options);

			const attachmentsMap = options?.capture ? this._captureEventAttachments : this._nonCaptureEventAttachments;
			const attachments = attachmentsMap.get(type);
			if (attachments !== undefined) {
				attachments.delete(wrapper);
				if (attachments.size === 0) {
					attachmentsMap.delete(type);
				}
			}
		}
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

			this._captureEventAttachments.forEach((wrappers, type) => {
				wrappers.forEach(wrapper => {
					window.removeEventListener(type, wrapper, { capture: true });
				});
			});
			this._captureEventAttachments.clear();

			this._nonCaptureEventAttachments.forEach((wrappers, type) => {
				wrappers.forEach(wrapper => {
					window.removeEventListener(type, wrapper);
				});
			});
			this._nonCaptureEventAttachments.clear();

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
	public static create(root: Node, options: InputLayerOptions = {}) {
		if (state.inputLayerRoots.includes(root)) {
			throw new Error("input layer already exists for the specified root node");
		}

		state.inputLayerRoots.push(root);

		let lastActiveElement: InputTarget | null = null;
		if (isInputTarget(document.activeElement)
			&& document.activeElement !== document.body
			&& !isOrContains(root, document.activeElement)) {

			lastActiveElement = document.activeElement;
			document.activeElement.blur();
		}

		const layer = new InputLayer(root, lastActiveElement);

		if (options.notify ?? true) {
			root.dispatchEvent(new CustomEvent<InputLayer>(InputLayer.CREATE_EVENT, { detail: layer }));
		}

		return layer;
	}
}
