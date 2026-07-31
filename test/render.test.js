import test from 'node:test';
import assert from 'node:assert/strict';
import { render, renderForScreenshot, validateTemplate } from '../src/render.js';

const validTemplate = '<html><BODY>prefix {{markdown}} suffix</body></html>';

test('renders markdown with the owned long Markdeep footer', () => {
  const markdown = '# Title\n\n<div>raw</div>\n</body>\n';
  const output = render(validTemplate, markdown);

  assert.equal(output, '<html><BODY>prefix {{markdown}} suffix<script>window.markdeepOptions = {tocStyle: \'long\'};</script>\n<script src="https://morgan3d.github.io/markdeep/latest/markdeep.min.js" charset="utf-8"></script></body></html>'.replace('{{markdown}}', markdown));
  assert.ok(output.indexOf(markdown) < output.indexOf('tocStyle'));
  assert.equal(output.match(/# Title\n\n<div>raw<\/div>\n<\/body>\n/)?.[0], markdown);
});

test('adds screenshot readiness markup after the Markdeep loader only for screenshots', () => {
  const normal = render('<body>{{markdown}}</body>', '# Title');
  const screenshot = renderForScreenshot('<body>{{markdown}}</body>', '# Title');

  assert.equal(normal, render('<body>{{markdown}}</body>', '# Title'));
  assert.match(screenshot, /markdeep\.min\.js[\s\S]*tocBuilderReady/);
  assert.equal(screenshot.indexOf('tocBuilderReady'), screenshot.lastIndexOf('tocBuilderReady'));
});

test('preserves replacement tokens in Markdown', () => {
  const markdown = 'literal $& and $$ and $` and $\'';
  const output = render('<body>{{markdown}}</body>', markdown);

  assert.ok(output.includes(markdown));
});

test('accepts exactly one placeholder inside one body region', () => {
  assert.doesNotThrow(() => validateTemplate('<body>{{markdown}}</body>'));
});

test('rejects missing or duplicate placeholders', () => {
  assert.throws(() => validateTemplate('<body></body>'), /exactly one.*placeholder/i);
  assert.throws(() => validateTemplate('<body>{{markdown}}{{markdown}}</body>'), /exactly one.*placeholder/i);
});

test('rejects placeholders outside the body', () => {
  assert.throws(() => validateTemplate('{{markdown}}<body></body>'), /inside.*body/i);
  assert.throws(() => validateTemplate('<body></body>{{markdown}}'), /inside.*body/i);
});

test('rejects ambiguous body regions and closing body tags', () => {
  assert.throws(() => validateTemplate('<body>{{markdown}}</body><body></body>'), /body/i);
  assert.throws(() => validateTemplate('<body>{{markdown}}</body></body>'), /closing.*body/i);
  assert.throws(() => validateTemplate('<body>{{markdown}}</body><BODY></BODY>'), /body/i);
});
