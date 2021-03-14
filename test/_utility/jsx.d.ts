
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: {
			ref?: (element: HTMLElement) => void;
			style?: string;
			hidden?: boolean;
		};
	}

	type Element = HTMLElement;
}
