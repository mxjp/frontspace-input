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

const defaultInputTypes = new Map<InputType, string[]>([
	[INPUT_NONE, []],
	[INPUT_KEYBOARD, ["keydown"]],
	[INPUT_MOUSE, ["mousedown"]],
	[INPUT_TOUCH, ["touchstart"]]
]);

const defaultIgnoredKeys = new Set([
	"Unidentified",
	"Alt",
	"AltGr",
	"AltGraph",
	"CapsLock",
	"Control",
	"Fn",
	"FnLock",
	"Meta",
	"OS",
	"Shift",
	"Super",
	"Hyper",
	"Symbol",
	"SymbolLock"
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
	 * An array of keyboard key values that are ignored by the input detection because these are likely to be used in combination with other input methods for instance control+clicking a link.
	 *
	 * @example
	 * ```ts
	 * // The following key values are ignored by default:
	 * ignoredKeys: [
	 *   "Unidentified",
	 *   "Alt",
	 *   "AltGr",
	 *   "AltGraph",
	 *   "CapsLock",
	 *   "Control",
	 *   "Fn",
	 *   "FnLock",
	 *   "Meta",
	 *   "OS",
	 *   "Shift",
	 *   "Super",
	 *   "Hyper",
	 *   "Symbol",
	 *   "SymbolLock"
	 * ]
	 * ```
	 */
	readonly ignoredKeys?: string[];

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

	const ignoredKeys = options.ignoredKeys ? new Set(options.ignoredKeys) : defaultIgnoredKeys;

	const listeners: [string, (event: Event) => void][] = [];
	for (const [type, defaultEvents] of defaultInputTypes) {
		const listener = (event: Event) => {
			if (!(event instanceof KeyboardEvent) || !ignoredKeys.has(event.key)) {
				setInputType(type);
			}
		};

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
