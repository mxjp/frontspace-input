
/**
 * Check if the specified element is visible in the document.
 */
export function isElementVisible(element: Element): boolean {
	if (element instanceof HTMLElement) {
		return Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length > 0);
	}
	return Boolean(element.getClientRects().length > 0);
}
