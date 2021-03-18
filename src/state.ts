import type { InputType } from "./input-type";
import { NodeTracer } from "./node-tracer";

export interface State {
	readonly version: number;
	readonly inputLayerRoots: Node[];

	inputType: InputType;
	inputDetectionTeardown: (() => void) | null;

	cycleFocus: boolean;
	focusBehaviorTeardown: (() => void) | null;

	lastActiveElementTracer: NodeTracer;
}

const key = Symbol.for("@frontspace/input/state");
export const state: State = (window as any)[key] ?? ((window as any)[key] = <State> {
	version: 0,
	inputLayerRoots: [],
	inputType: "none",
	inputDetectionTeardown: null,
	cycleFocus: false,
	focusBehaviorTeardown: null,
	lastActiveElementTracer: new NodeTracer()
});

/* istanbul ignore if */
if (state.version !== 0) {
	throw new Error("existing state is incompatible");
}
