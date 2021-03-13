
export function html(value: string) {
	const fragment = document.createDocumentFragment();
	const element = document.createElement("div");
	element.innerHTML = value;
	fragment.append(...element.childNodes);
	return fragment;
}
