
declare namespace JSX {
	interface IntrinsicElements {
		[elemName: string]: {
			ref?: (element: HTMLElement) => void;
			style?: string;
			hidden?: boolean;
			disabled?: boolean;
			type?: string;
			name?: string;
			checked?: boolean;
		};
	}

	type Element = HTMLElement;
}
