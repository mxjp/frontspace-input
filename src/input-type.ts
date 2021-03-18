import { state } from "./state";

export const INPUT_NONE = "none";
export const INPUT_KEYBOARD = "keyboard";
export const INPUT_MOUSE = "mouse";
export const INPUT_TOUCH = "touch";

export type InputType
	= typeof INPUT_NONE
	| typeof INPUT_KEYBOARD
	| typeof INPUT_MOUSE
	| typeof INPUT_TOUCH;

const inputTypes = new Map<InputType, string[]>([
	[INPUT_NONE, []],
	[INPUT_KEYBOARD, ["keydown"]],
	[INPUT_MOUSE, ["mousedown"]],
	[INPUT_TOUCH, ["touchstart"]]
]);

/**
 * Get the current primary input type that is used.
 *
 * Note that input detection has to be enabled using {@see setInputDetection} for this to work.
 */
export function getInputType(): InputType {
	return state.inputType;
}

export interface InputDetectionOptions {
	/**
	 * An object for setting the events that are used to detect a specific input type.
	 *
	 * @example
	 * ```ts
	 * // The following events are used by default:
	 * events: {
	 *   none: [],
	 *   keyboard: ["keydown"],
	 *   mouse: ["mousedown"],
	 *   touch: ["touchstart"]
	 * }
	 * ```
	 */
	readonly events?: Readonly<Record<InputType, string[]>>;

	/**
	 * If true, the `inputType` data attribute is set on the root element. This can be used to access the current input type from within css to show focus indicators only when the keyboard is used consistently across browsers.
	 * @default false
	 * @example
	 * ```css
	 * a:focus {
	 *   outline: none;
	 * }
	 *
	 * :root[data-input-type=keyboard] a:focus {
	 *   outline: 1px solid blue;
	 * }
	 * ```
	 */
	readonly indicatorAttribute?: boolean;
}

/**
 * Set how input types are detected. By default, the input type is not detected at all.
 */
export function setupInputDetection(options: InputDetectionOptions = {}) {
	state.inputDetectionTeardown?.();
	state.inputDetectionTeardown = null;

	const indicatorAttributes = options.indicatorAttribute ?? false;

	function setInputType(type: InputType) {
		state.inputType = type;
		if (indicatorAttributes) {
			document.documentElement.dataset.inputType = type;
		}
	}

	setInputType(INPUT_NONE);

	const listeners: [string, () => void][] = [];
	for (const [type, defaultEvents] of inputTypes) {
		const listener = () => setInputType(type);
		for (const event of (options.events?.[type] ?? defaultEvents)) {
			listeners.push([event, listener]);
			window.addEventListener(event, listener, { capture: true, passive: true });
		}
	}

	state.inputDetectionTeardown = () => {
		for (const [event, listener] of listeners) {
			window.removeEventListener(event, listener, { capture: true });
		}
		if (indicatorAttributes) {
			delete document.documentElement.dataset.inputType;
		}
	};
}
