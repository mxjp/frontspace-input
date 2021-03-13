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
