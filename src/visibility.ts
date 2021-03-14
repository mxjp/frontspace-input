
/**
 * Check if the specified element is visible in the document.
 */
export function isElementVisible(element: HTMLElement): boolean {
	if (element.offsetParent === null) {
		if (element === document.body || element === document.documentElement) {
			return getComputedStyle(element).display !== "none";
		}
		const parent = element.parentElement;
		if (parent && getComputedStyle(element).display !== "none") {
			return isElementVisible(parent);
		}
		return false;
	}
	if (!element.isConnected) {
		return false;
	}
	return true;
}
