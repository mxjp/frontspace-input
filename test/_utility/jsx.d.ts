
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: {
			ref?: (element: HTMLElement) => void;
		};
	}

	type Element = HTMLElement;
}
