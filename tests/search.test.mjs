import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

// Execute the real inline browser script with controlled DOM, timers and
// Pagefind promises so races are deterministic (no third-party test runner).
const source = await readFile(new URL('../src/pages/search.astro', import.meta.url), 'utf8');
const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
const settle = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
	let resolve, reject;
	const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
	return { promise, resolve, reject };
}
function element() {
	return {
		children: [], textContent: '', value: '',
		append(...nodes) { this.children.push(...nodes); },
		replaceChildren(...nodes) { this.children = nodes; },
		addEventListener(type, listener) { this[type] = listener; },
	};
}
async function harness(search, loadError, { pagefind = true, posts = [] } = {}) {
	const input = element(), results = element(), status = element();
	const searchData = { textContent: JSON.stringify(posts), dataset: { pagefind: String(pagefind) } };
	let timer, imports = 0;
	const context = vm.createContext({
		URL, window: { location: { origin: 'https://blog.aotrading.io' } },
		document: {
			getElementById: (id) => ({ 'search-input': input, 'search-results': results, 'search-status': status, 'search-posts': searchData })[id],
			createElement: element,
		},
		setTimeout: (callback) => { timer = callback; },
		clearTimeout: () => { timer = undefined; },
	});
	const module = new vm.SyntheticModule(['search'], function () { this.setExport('search', search); }, { context });
	await module.link(() => {});
	await module.evaluate();
	new vm.Script(script, {
		importModuleDynamically: async () => {
			imports++;
			if (loadError) throw loadError;
			return module;
		},
	}).runInContext(context);
	return {
		input, results, status, imports: () => imports,
		type(value) { input.value = value; input.input(); },
		async run() { timer?.(); timer = undefined; await settle(); },
		titles() { return results.children.map((li) => li.children[0].children[0].textContent); },
	};
}
const article = (title, url = `/blog/${title}/`) => ({ url, meta: { title } });
const result = (data) => ({ data: () => Promise.resolve(data) });

test('an older search response cannot append to a newer result set', async () => {
	const old = deferred();
	const h = await harness((query) => query === 'old' ? old.promise : Promise.resolve({ results: [result(article('new'))] }));
	h.type('old'); await h.run();
	h.type('new'); await h.run();
	old.resolve({ results: [result(article('old'))] }); await settle();
	assert.deepEqual(h.titles(), ['new']);
	assert.match(h.status.textContent, /1 article found/);
	assert.equal(h.imports(), 1);
});

test('late article data is invalidated immediately, before the next debounce', async () => {
	const late = deferred();
	const h = await harness(async () => ({ results: [{ data: () => late.promise }] }));
	h.type('old'); await h.run();
	h.type('new');
	late.resolve(article('old')); await settle();
	assert.deepEqual(h.titles(), []);
	assert.equal(h.status.textContent, 'Searching…');
});

test('clearing input prevents late results and restores the prompt', async () => {
	const late = deferred();
	const h = await harness(async () => ({ results: [{ data: () => late.promise }] }));
	h.type('old'); await h.run();
	h.type('   ');
	late.resolve(article('old')); await settle();
	assert.deepEqual(h.titles(), []);
	assert.equal(h.status.textContent, 'Type to search all articles.');
});

test('relevance order survives out-of-order data resolution and URL duplicates', async () => {
	const first = deferred();
	const h = await harness(async () => ({ results: [
		{ data: () => first.promise }, result(article('second')),
		result(article('duplicate', '/blog/first/index.html#heading')),
		result(article('duplicate', 'https://blog.aotrading.io/blog/first')),
	] }));
	h.type('query'); await h.run();
	assert.deepEqual(h.titles(), []);
	first.resolve(article('first')); await settle();
	assert.deepEqual(h.titles(), ['first', 'second']);
	assert.match(h.status.textContent, /2 articles found/);
});

test('no matches and the eight-row cap have accurate status messages', async () => {
	const h = await harness(async (query) => ({ results: query === 'none' ? [] : Array.from({ length: 10 }, (_, i) => result(article(String(i)))) }));
	h.type('none'); await h.run();
	assert.match(h.status.textContent, /No articles found/);
	h.type('all'); await h.run();
	assert.equal(h.results.children.length, 8);
	assert.match(h.status.textContent, /10 articles found.*Showing the first 8/);
});

test('index import failure falls back to article titles without repeated imports', async () => {
	const h = await harness(() => {}, new Error('No built index'), { posts: [article('query article')] });
	h.type('query'); await h.run();
	assert.deepEqual(h.titles(), ['query article']);
	h.type('retry'); await h.run();
	assert.equal(h.imports(), 1);
	assert.equal(h.status.textContent, 'No articles found for “retry”.');
});

test('article loading failure is handled; obsolete failures do not overwrite a newer search', async () => {
	const late = deferred();
	const h = await harness(async (query) => ({ results: query === 'old' ? [{ data: () => late.promise }] : [result(article('new'))] }));
	h.type('old'); await h.run();
	h.type('new'); await h.run();
	late.reject(new Error('Old request failed')); await settle();
	assert.deepEqual(h.titles(), ['new']);
	assert.match(h.status.textContent, /1 article found/);
	const failed = await harness(async () => ({ results: [{ data: async () => { throw new Error('Failed'); } }] }), undefined, { posts: [article('query article')] });
	failed.type('query'); await failed.run();
	assert.deepEqual(failed.titles(), ['query article']);
});

test('Astro development search uses embedded article titles without loading Pagefind', async () => {
	const h = await harness(() => { throw new Error('Pagefind should not load'); }, undefined, {
		pagefind: false,
		posts: [article('Risk Management in Trading'), article('Trading Signals'), article('Other')],
	});
	h.type('trading'); await h.run();
	assert.deepEqual(h.titles(), ['Risk Management in Trading', 'Trading Signals']);
	assert.equal(h.imports(), 0);
	h.type('risk trading'); await h.run();
	assert.deepEqual(h.titles(), ['Risk Management in Trading']);
});
