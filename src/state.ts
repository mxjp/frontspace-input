import type { InputType } from "./input-type";
import { NodeTracer } from "./node-tracer";

export interface State {
	/** The version of this state */
	readonly version: number;
	/** Stack of input layer root elements */
	readonly inputLayerRoots: Node[];
	/** The current detected input type */
	inputType: InputType;
	/** Function to dispose the current input detection */
	inputDetectionTeardown: (() => void) | null;
	/** True to enable focus cycling */
	cycleFocus: boolean;
	/** Function to dispose the current focus behavior */
	focusBehaviorTeardown: (() => void) | null;
	/** Node tracer for the last active element. */
	readonly lastActiveElementTracer: NodeTracer;
	/** Map of containers to linked anchors */
	detachedContainers: WeakMap<Element, Element>;
	/** Map of anchors to number of linked containers */
	detachedAnchors: WeakMap<Element, number>;
}

const key = Symbol.for("@frontspace/input/state");
export const state: State = (window as any)[key] ?? ((window as any)[key] = <State> {
	version: 0,
	inputLayerRoots: [],
	inputType: "none",
	inputDetectionTeardown: null,
	cycleFocus: false,
	focusBehaviorTeardown: null,
	lastActiveElementTracer: new NodeTracer(),
	detachedContainers: new WeakMap(),
	detachedAnchors: new WeakMap()
});

/* istanbul ignore if */
if (state.version !== 0) {
	throw new Error("existing state is incompatible");
}
