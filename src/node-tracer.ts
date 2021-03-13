
/**
 * An object that keeps renference to a node. When the node or a parent is removed, the tracer will keep track of it's siblings. This can be used to approximate the location of a node in a document after it has been removed.
 */
export class NodeTracer {
	private _nodes: Node[] = [];
	private _observers: Observer[] = [];
	private _target: Node | null = null;
	private _previousSibling: Node | null = null;
	private _nextSibling: Node | null = null;

	/**
	 * Get or set the target node.
	 *
	 * After the target or a parent has been removed, this will return null.
	 */
	 public get target(): Node | null {
		return this._target;
	}

	public set target(value: Node | null) {
		this._target = value;
		this._previousSibling = null;
		this._nextSibling = null;

		this._nodes = [];
		while (value) {
			this._nodes.unshift(value);
			value = value.parentNode;
		}

		for (let i = 0; i < this._nodes.length - 1; i++) {
			const existing = this._observers[i];
			if (existing?.node !== this._nodes[i]) {
				if (existing) {
					existing.observer.disconnect();
				}
				const observer = new MutationObserver(records => {
					for (let r = 0; r < records.length; r++) {
						const record = records[r];
						const removedNodes = new Set(record.removedNodes);
						const target = this._nodes[i + 1];
						if (removedNodes.has(target)) {
							this._target = null;
							this._previousSibling = getPreviousSibling(record, target);
							this._nextSibling = getNextSibling(record, target);
							for (let d = i + 1; d < this._observers.length; d++) {
								this._observers[d].observer.disconnect();
							}
							this._observers.length = i;
							this._nodes.length = i + 1;
						} else if (this._target === null) {
							if (this._previousSibling !== null && removedNodes.has(this._previousSibling)) {
								this._previousSibling = getPreviousSibling(record, target);
							}
							if (this._nextSibling !== null && removedNodes.has(this._nextSibling)) {
								this._nextSibling = getNextSibling(record, target);
							}
						}
					}
				});
				observer.observe(this._nodes[i], { childList: true });
				this._observers[i] = {
					observer,
					node: this._nodes[i]
				};
			}
		}

		for (let i = Math.max(0, this._nodes.length - 1); i < this._observers.length; i++) {
			this._observers[i].observer.disconnect();
		}
		this._observers.length = Math.max(0, this._nodes.length - 1);
	}

	/**
	 * + If the target has been removed, get the previous sibling of the target or any parent.
	 * + If the target is still attached or there is no previous sibling, this will return null.
	 */
	public get previousSibling(): Node | null {
		return this._previousSibling;
	}

	/**
	 * + If the target has been removed, get the previous sibling of the target or any parent.
	 * + If the target is still attached or there is no previous sibling, this will return null.
	 */
	public get nextSibling(): Node | null {
		return this._nextSibling;
	}

	/**
	 * Stop observing the target.
	 */
	public disconnect() {
		this.target = null;
	}
}

interface Observer {
	readonly observer: MutationObserver;
	readonly node: Node;
}

function getPreviousSibling(parentRecord: MutationRecord, node: Node | null) {
	if (parentRecord.previousSibling !== null) {
		return parentRecord.previousSibling;
	}
	if (node !== null && node.previousSibling !== null) {
		return node.previousSibling;
	}
	let parent: Node | null = parentRecord.target;
	while (parent !== null) {
		if (parent.previousSibling !== null) {
			return parent.previousSibling;
		}
		parent = parent.parentNode;
	}
	return null;
}

function getNextSibling(parentRecord: MutationRecord, node: Node | null) {
	if (parentRecord.nextSibling !== null) {
		return parentRecord.nextSibling;
	}
	if (node !== null && node.nextSibling !== null) {
		return node.nextSibling;
	}
	let parent: Node | null = parentRecord.target;
	while (parent !== null) {
		if (parent.nextSibling !== null) {
			return parent.nextSibling;
		}
		parent = parent.parentNode;
	}
	return null;
}
