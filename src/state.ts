import type { InputType } from "./input-type";

export interface State {
	readonly version: number;
	readonly inputLayerRoots: Node[];

	inputType: InputType;
	inputDetectionTeardown: (() => void) | null;
}

const key = Symbol.for("@frontspace/input/state");
export const state: State = (window as any)[key] ?? ((window as any)[key] = <State> {
	version: 0,
	inputLayerRoots: [],
	inputType: "none",
	inputDetectionTeardown: null
});

/* istanbul ignore if */
if (state.version !== 0) {
	throw new Error("existing state is incompatible");
}
