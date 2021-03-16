
/**
 * An object that keeps renference to a node. When the node or a parent is removed, the tracer will keep track of it's siblings. This can be used to approximate the location of a node in a document after it has been removed.
 */
export class NodeTracer {
	/**
	 * Create a new node tracer.
	 * @param root If specified, any parent nodes of this root node will not be observed.
	 */
	public constructor(root: Node | null = null) {
		this._root = root;
	}

	private _root: Node | null;
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
		this.processPendingMutations();
		return this._target;
	}

	public set target(value: Node | null) {
		this._target = value;
		this._previousSibling = null;
		this._nextSibling = null;

		this._nodes = [];
		while (value) {
			this._nodes.unshift(value);
			if (value === this._root) {
				break;
			}
			value = value.parentNode;
		}

		for (let i = 0; i < this._nodes.length - 1; i++) {
			const existing = this._observers[i];
			if (existing?.node !== this._nodes[i]) {
				if (existing) {
					existing.observer.disconnect();
				}
				const observer = new MutationObserver(r => this.processMutations(r, i));
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
		this.processPendingMutations();
		return this._previousSibling;
	}

	/**
	 * + If the target has been removed, get the previous sibling of the target or any parent.
	 * + If the target is still attached or there is no previous sibling, this will return null.
	 */
	public get nextSibling(): Node | null {
		this.processPendingMutations();
		return this._nextSibling;
	}

	/**
	 * Stop observing the target.
	 */
	public disconnect() {
		this.target = null;
	}

	/**
	 * Called to take and process pending mutation records from all observers.
	 */
	protected processPendingMutations() {
		for (let i = 0; i < this._observers.length; i++) {
			const records = this._observers[i].observer.takeRecords();
			if (records.length > 0) {
				this.processMutations(records, i);
			}
		}
	}

	/**
	 * Called to process mutations detected by an observer.
	 * @param nodeIndex The index of the node which's observer has detected the mutations.
	 */
	protected processMutations(records: MutationRecord[], nodeIndex: number) {
		for (let i = 0; i < records.length; i++) {
			const record = records[i];
			const removedNodes = new Set(record.removedNodes);
			const nodeTarget = this._nodes[nodeIndex + 1];
			if (nodeTarget && removedNodes.has(nodeTarget)) {
				this._target = null;
				this._previousSibling = this.getPreviousSibling(record, nodeTarget);
				this._nextSibling = this.getNextSibling(record, nodeTarget);
				for (let r = nodeIndex + 1; r < this._observers.length; r++) {
					this._observers[r].observer.disconnect();
				}
				this._observers.length = nodeIndex + 1;
				this._nodes.length = nodeIndex + 1;
			} else if (!this._target) {
				if (this._previousSibling && removedNodes.has(this._previousSibling)) {
					this._previousSibling = this.getPreviousSibling(record, nodeTarget);
				}
				if (this._nextSibling && removedNodes.has(this._nextSibling)) {
					this._nextSibling = this.getNextSibling(record, nodeTarget);
				}
			}
		}
	}

	/**
	 * Called to get the previous sibling for a node that has been removed.
	 * @param parentRecord A mutation record for the parent node.
	 * @param node The removed node.
	 * @returns The sibling or null if there is none.
	 */
	protected getPreviousSibling(parentRecord: MutationRecord, node: Node | null) {
		if (parentRecord.previousSibling) {
			return parentRecord.previousSibling;
		}
		if (node && node.previousSibling) {
			return node.previousSibling;
		}
		let parent: Node | null = parentRecord.target;
		while (parent) {
			if (parent === this._root) {
				return null;
			}
			if (parent.previousSibling) {
				return parent.previousSibling;
			}
			parent = parent.parentNode;
		}
		return null;
	}

	/**
	 * Called to get the next sibling for a node that has been removed.
	 * @param parentRecord A mutation record for the parent node.
	 * @param node The removed node.
	 * @returns The sibling or null if there is none.
	 */
	protected getNextSibling(parentRecord: MutationRecord, node: Node | null) {
		if (parentRecord.nextSibling) {
			return parentRecord.nextSibling;
		}
		if (node && node.nextSibling) {
			return node.nextSibling;
		}
		let parent: Node | null = parentRecord.target;
		while (parent) {
			if (parent === this._root) {
				return null;
			}
			if (parent.nextSibling) {
				return parent.nextSibling;
			}
			parent = parent.parentNode;
		}
		return null;
	}
}

interface Observer {
	readonly observer: MutationObserver;
	readonly node: Node;
}
