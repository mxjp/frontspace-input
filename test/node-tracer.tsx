import test from "ava";
import { NodeTracer } from "../src/node-tracer";
import { microtask } from "./_utility/timing";
import { createElement } from "./_utility/html";

test("falls back to siblings", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, prev);
	t.is(tracer.nextSibling, next);
});

test("falls back to parent siblings if the target is removed", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, prev);
	t.is(tracer.nextSibling, next);
});

test("falls back to parent siblings if the parent is removed", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, prev);
	t.is(tracer.nextSibling, next);
});

test("falls back to no siblings if missing", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, null);
	t.is(tracer.nextSibling, null);
});

test("falls back to outer siblings when siblings are removed", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, prev);
	t.is(tracer.nextSibling, next);

	prev.remove();
	next.remove();
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, outerPrev);
	t.is(tracer.nextSibling, outerNext);

	outerPrev.remove();
	outerNext.remove();
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, null);
	t.is(tracer.nextSibling, null);
});

test("ignores external changes when a root is specified", async t => {
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
	await microtask();

	t.is(tracer.target, target);
});

test("ignores external siblings when a root is specified", async t => {
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
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, prev);
	t.is(tracer.nextSibling, next);

	prev.remove();
	next.remove();
	await microtask();

	t.is(tracer.target, null);
	t.is(tracer.previousSibling, null);
	t.is(tracer.nextSibling, null);
});
