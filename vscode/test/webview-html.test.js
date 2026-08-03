import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareWebviewHtml } from '../src/webview-html.js';
import { validateInboundMessage, PROTOCOL_VERSION, MESSAGE_TYPES } from '../src/protocol.js';

test('protocol message validation', () => {
  assert.equal(
    validateInboundMessage({ protocol: 1, type: MESSAGE_TYPES.READY, revision: 1, tocCount: 2 }),
    true
  );
  assert.equal(
    validateInboundMessage({ protocol: 1, type: MESSAGE_TYPES.REQUEST_REFRESH, requestId: 'r1', revision: 1 }),
    true
  );
  assert.equal(
    validateInboundMessage({ protocol: 1, type: MESSAGE_TYPES.REQUEST_SCREENSHOT, requestId: 101, revision: 1 }),
    true
  );
  assert.equal(
    validateInboundMessage({ protocol: 2, type: MESSAGE_TYPES.READY, revision: 1, tocCount: 2 }),
    false
  );
  assert.equal(
    validateInboundMessage({ protocol: 1, type: 'invalidType', revision: 1 }),
    false
  );
  assert.equal(validateInboundMessage(null), false);
});

test('webview HTML adapter inserts CSP as first element in head', () => {
  const inputHtml = '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
  const result = prepareWebviewHtml(inputHtml, {
    cspSource: 'vscode-webview://test-source',
    sourceUri: 'file:///path/to/doc.md',
    revision: 1,
  });

  const headStart = result.indexOf('<head>');
  const cspStart = result.indexOf('<meta http-equiv="Content-Security-Policy"');
  const titleStart = result.indexOf('<title>');

  assert.ok(headStart !== -1);
  assert.ok(cspStart > headStart);
  assert.ok(cspStart < titleStart);
  assert.ok(result.includes('vscode-webview://test-source'));
  assert.ok(result.includes("script-src 'unsafe-inline' https://morgan3d.github.io"));
});

test('webview HTML adapter rejects existing template CSP meta', () => {
  const templateHtml = '<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'"><title>Test</title></head><body></body></html>';
  const result = prepareWebviewHtml(templateHtml, { cspSource: 'https://test' });

  const cspMatches = result.match(/content-security-policy/gi);
  assert.equal(cspMatches.length, 1);
  assert.ok(!result.includes("default-src 'self'"));
});

test('webview HTML adapter formats base tag with trailing slash', () => {
  const inputHtml = '<html><head></head><body></body></html>';

  const res1 = prepareWebviewHtml(inputHtml, { baseUri: 'https://example.com/folder' });
  assert.ok(res1.includes('<base href="https://example.com/folder/">'));

  const res2 = prepareWebviewHtml(inputHtml, { baseUri: 'https://example.com/folder/' });
  assert.ok(res2.includes('<base href="https://example.com/folder/">'));
});

test('webview HTML adapter safely JSON-encodes state escaping <', () => {
  const inputHtml = '<html><head></head><body></body></html>';
  const result = prepareWebviewHtml(inputHtml, {
    sourceUri: 'file:///path/<script>alert(1)</script>',
    revision: 5,
  });

  const escapedSubstr = '\\' + 'u003cscript>alert(1)\\' + 'u003c/script>';
  assert.ok(!result.includes('<script>alert(1)</script>'));
  assert.ok(result.includes(escapedSubstr));
  assert.ok(result.includes('acquireVsCodeApi()'));
  assert.ok(result.includes('requestAnimationFrame'));
});

test('webview HTML adapter escapes non-ASCII characters in URIs once', () => {
  const inputHtml = '<html><head></head><body></body></html>';
  const result = prepareWebviewHtml(inputHtml, {
    sourceUri: 'file:///path/ö/doc.md',
    baseUri: 'file:///path/ö',
  });

  assert.ok(result.includes('file:///path/%C3%B6/doc.md'));
  assert.ok(result.includes('<base href="file:///path/%C3%B6/">'));
});
