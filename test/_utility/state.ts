import { InputType } from "../../src";
import { state } from "../../src/state";

export function setInputType(type: InputType) {
	state.inputDetectionTeardown?.();
	state.inputType = type;
}
