import test from "ava";
import { NodeTracer } from "../src/node-tracer";
import { microtask } from "./_utility/timing";
import { createElement } from "./_utility/html";

for (const immediate of [true, false]) {
	const suffix = immediate ? "(immediate)" : "";

	test.serial(`allows switching nested targets within same parent ${suffix}`, async t => {
		let a!: HTMLElement;
		let bPrev!: HTMLElement;
		let b!: HTMLElement;
		<div>
			<div ref={v => bPrev = v}>
				<div ref={v => a = v} />
			</div>
			<div>
				<div ref={v => b = v} />
			</div>
		</div>;

		const tracer = new NodeTracer();
		tracer.target = a;
		tracer.target = b;

		t.is(tracer.target, b);

		b.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, bPrev);
		t.is(tracer.nextSibling, null);
	});

	test.serial(`falls back to siblings ${suffix}`, async t => {
		let target: HTMLElement = null!;
		<div>
			prev
			<div ref={v => target = v}></div>
			next
		</div>;

		const tracer = new NodeTracer();
		const prev = target.previousSibling;
		const next = target.nextSibling;
		tracer.target = target;

		t.is(tracer.target, target);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);
	});

	test.serial(`falls back to parent siblings if the target is removed ${suffix}`, async t => {
		let target: HTMLElement = null!;

		<div>
			prev
			<div><div ref={v => target = v}></div></div>
			next
		</div>;

		const tracer = new NodeTracer();
		const prev = target.parentNode!.previousSibling;
		const next = target.parentNode!.nextSibling;

		tracer.target = target;

		t.is(tracer.target, target);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);
	});

	test.serial(`falls back to parent siblings if the parent is removed ${suffix}`, async t => {
		let target: HTMLElement = null!;

		<div>
			prev
			<div><div ref={v => target = v}></div></div>
			next
		</div>;

		const tracer = new NodeTracer();
		const prev = target.parentNode!.previousSibling;
		const next = target.parentNode!.nextSibling;

		tracer.target = target;

		t.is(tracer.target, target);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);

		target.parentElement!.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);
	});

	test.serial(`falls back to no siblings if missing ${suffix}`, async t => {
		let target: HTMLElement = null!;
		<div>
			<div ref={v => target = v}></div>
		</div>;

		const tracer = new NodeTracer();
		tracer.target = target;

		t.is(tracer.target, target);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);
	});

	test.serial(`falls back to outer siblings when siblings are removed ${suffix}`, async t => {
		let target: HTMLElement = null!;
		<div>
			<span />
			prev
			<div ref={v => target = v}></div>
			next
			<span />
		</div>;

		const tracer = new NodeTracer();
		const prev = target.previousSibling!;
		const next = target.nextSibling!;
		const outerPrev = prev.previousSibling!;
		const outerNext = next.nextSibling!;

		tracer.target = target;

		t.is(tracer.target, target);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);

		prev.remove();
		next.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, outerPrev);
		t.is(tracer.nextSibling, outerNext);

		outerPrev.remove();
		outerNext.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);
	});

	test.serial(`falls back to outer siblings when the target parent is removed ${suffix}`, async t => {
		let outerTarget!: HTMLElement;
		let target!: HTMLElement;
		const root = <div>
			outer prev
			<div ref={v => outerTarget = v}>
				prev
				<div ref={v => target = v}></div>
				next
			</div>
			outer next
		</div>;

		const outerPrev = outerTarget.previousSibling!;
		const prev = target.previousSibling!;
		const next = target.nextSibling!;
		const outerNext = outerTarget.nextSibling!;

		const tracer = new NodeTracer(root);
		tracer.target = target;

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);

		outerTarget.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, outerPrev);
		t.is(tracer.nextSibling, outerNext);

		outerPrev.remove();
		outerNext.remove();

		outerTarget.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);
	});

	test.serial(`ignores external changes when a root is specified ${suffix}`, async t => {
		let root: HTMLElement = null!;
		let target: HTMLElement = null!;

		<div>
			<div ref={v => root = v}>
				<div ref={v => target = v} />
			</div>
		</div>;

		const tracer = new NodeTracer(root);
		tracer.target = target;

		t.is(tracer.target, target);

		root.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, target);
	});

	test.serial(`ignores external siblings when a root is specified ${suffix}`, async t => {
		let root: HTMLElement = null!;
		let target: HTMLElement = null!;

		<div>
			external prev
			<div ref={v => root = v}>
				prev
				<div ref={v => target = v} />
				next
			</div>
			external next
		</div>;

		const prev = target.previousSibling!;
		const next = target.nextSibling!;

		const tracer = new NodeTracer(root);
		tracer.target = target;

		target.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, prev);
		t.is(tracer.nextSibling, next);

		prev.remove();
		next.remove();
		if (!immediate) {
			await microtask();
		}

		t.is(tracer.target, null);
		t.is(tracer.previousSibling, null);
		t.is(tracer.nextSibling, null);
	});
}
