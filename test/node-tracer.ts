import test from "ava";
import { NodeTracer } from "../src/node-tracer";
import { html } from "./_utility/dom";
import { microtask } from "./_utility/timing";

test("falls back to siblings", async t => {
	const doc = html(`
		prev
		<div id="target"></div>
		next
	`);

	const tracer = new NodeTracer();
	const target = doc.getElementById("target")!;
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
	const doc = html(`
		prev
		<div><div id="target"></div></div>
		next
	`);

	const tracer = new NodeTracer();
	const target = doc.getElementById("target")!;
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
	const doc = html(`
		prev
		<div><div id="target"></div></div>
		next
	`);

	const tracer = new NodeTracer();
	const target = doc.getElementById("target")!;
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
	const doc = html(`<div id="target"></div>`);

	const tracer = new NodeTracer();
	const target = doc.getElementById("target")!;
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
