import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../src/components/BaseHead.astro', import.meta.url), 'utf8');
const inlineScripts = [...source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)];
const consentScript = inlineScripts[1]?.[1];
assert.ok(consentScript, 'The head must include a synchronous consent script');

function consentDefault(choice, storageError = false) {
	const window = { dataLayer: [] };
	const localStorage = {
		getItem(key) {
			assert.equal(key, 'cookie-consent');
			if (storageError) throw new Error('Storage blocked');
			return choice;
		},
	};
	vm.runInNewContext(consentScript, { window, localStorage });
	const entry = Array.from(window.dataLayer[0]);
	return { count: window.dataLayer.length, command: entry[0], kind: entry[1], settings: entry[2] };
}

test('saved opt-in is granted before the Google tag can send its page view', () => {
	const result = consentDefault('granted');
	assert.equal(result.count, 1);
	assert.equal(result.command, 'consent');
	assert.equal(result.kind, 'default');
	assert.equal(result.settings.analytics_storage, 'granted');
	assert.equal(result.settings.ad_storage, 'denied');
	assert.equal(result.settings.ad_user_data, 'denied');
	assert.equal(result.settings.ad_personalization, 'denied');
});

test('denial, no choice, corrupt choice, and blocked storage remain denied', () => {
	for (const choice of ['denied', null, 'unexpected']) {
		assert.equal(consentDefault(choice).settings.analytics_storage, 'denied');
	}
	assert.equal(consentDefault(null, true).settings.analytics_storage, 'denied');
});
