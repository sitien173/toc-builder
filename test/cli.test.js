import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { main, parseArgs, run } from '../src/cli.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function fixture(files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'toc-cli-test-'));
  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(directory, name), content, 'utf8');
  }
  return directory;
}

async function removeOutput(outputPath) {
  if (outputPath) await fs.rm(outputPath, { force: true });
}

test('parses one Markdown path and an optional template', () => {
  assert.deepEqual(parseArgs(['README.MD']), { input: 'README.MD', template: null, screenshot: false });
  assert.deepEqual(parseArgs(['README.md', '--template', 'custom.html']), {
    input: 'README.md', template: 'custom.html', screenshot: false
  });
  assert.deepEqual(parseArgs(['README.md', '--screenshot']), {
    input: 'README.md', template: null, screenshot: true
  });
  assert.deepEqual(parseArgs(['README.md', '--screenshot', '--template', 'custom.html']), {
    input: 'README.md', template: 'custom.html', screenshot: true
  });
  assert.deepEqual(parseArgs(['README.md', '--template', 'custom.html', '--screenshot']), {
    input: 'README.md', template: 'custom.html', screenshot: true
  });
});

test('rejects invalid argument combinations with exit code 2', () => {
  for (const argv of [
    [],
    ['one.md', 'two.md'],
    ['one.txt'],
    ['one.md', '--unknown'],
    ['one.md', '--template'],
    ['one.md', '--template', 'a.html', '--template', 'b.html'],
    ['one.md', '--screenshot', '--screenshot']
  ]) {
    assert.throws(() => parseArgs(argv), error => error.exitCode === 2);
  }
});

test('maps argument and operational failures to exit codes without stack traces', async () => {
  const errors = [];
  assert.equal(await main([], { error: value => errors.push(value) }), 2);
  assert.equal(await main(['missing.md'], { error: value => errors.push(value) }), 1);
  assert.equal(errors.length, 2);
  assert.ok(errors.every(value => !value.includes('Error:')));
  assert.ok(errors.every(value => !value.includes(' at ')));
});

test('runs when invoked through an npm-style symlink', async () => {
  const directory = await fixture({});
  try {
    const binPath = path.join(directory, 'toc');
    await fs.symlink(path.join(projectRoot, 'src/cli.js'), binPath);

    const result = spawnSync(binPath, [], { encoding: 'utf8' });

    assert.equal(result.status, 2);
    assert.match(result.stderr, /Expected exactly one Markdown file/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('renders, exclusively writes, prints, and opens a temporary HTML file', async () => {
  const directory = await fixture({ 'README.MD': '# Unicode café\n' });
  const printed = [];
  const opened = [];
  let outputPath;
  try {
    ({ outputPath } = await run(['README.MD'], {
      cwd: directory,
      print: value => printed.push(value),
      openFile: async value => opened.push(value)
    }));
    assert.equal(printed.length, 1);
    assert.equal(printed[0], outputPath);
    assert.equal(path.dirname(outputPath), os.tmpdir());
    assert.match(path.basename(outputPath), /^[0-9a-f-]{36}_README\.md\.html$/);
    assert.equal(opened[0], pathToFileURL(outputPath).href);
    assert.match(await fs.readFile(outputPath, 'utf8'), /# Unicode café/);
  } finally {
    await removeOutput(outputPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('runs the optional screenshot workflow with related exclusive outputs', async () => {
  const directory = await fixture({ 'README.md': '# heading' });
  const printed = [];
  const events = [];
  let outputPath;
  let pngPath;
  const bytes = Buffer.from([1, 2, 3]);
  try {
    ({ outputPath, pngPath } = await run(['README.md', '--screenshot'], {
      cwd: directory,
      print: value => printed.push(value),
      openFile: async () => events.push('open'),
      captureScreenshot: async html => { events.push('capture'); assert.match(html, /tocBuilderReady/); return bytes; },
      copyImage: async received => { events.push('copy'); assert.deepEqual(received, bytes); },
    }));
    assert.deepEqual(printed, [outputPath, pngPath]);
    assert.equal(events[0], 'open');
    assert.deepEqual(events.slice(1), ['capture', 'copy']);
    assert.match(path.basename(outputPath), /^[0-9a-f-]{36}_README\.md\.html$/);
    assert.match(path.basename(pngPath), /^[0-9a-f-]{36}_README\.md\.toc\.png$/);
    assert.equal(path.basename(outputPath).slice(0, 36), path.basename(pngPath).slice(0, 36));
    assert.deepEqual(await fs.readFile(pngPath), bytes);
  } finally {
    await removeOutput(outputPath);
    await removeOutput(pngPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('does not capture when opening the generated HTML fails', async () => {
  const directory = await fixture({ 'README.md': '# heading' });
  let outputPath;
  let captured = false;
  try {
    await assert.rejects(run(['README.md', '--screenshot'], {
      cwd: directory,
      openFile: async () => { throw new Error('browser unavailable'); },
      captureScreenshot: async () => { captured = true; return Buffer.from('PNG'); },
    }), error => error.exitCode === 1);
    assert.equal(captured, false);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('clipboard failure warns but succeeds after retaining the PNG', async () => {
  const directory = await fixture({ 'README.md': '# heading' });
  const warnings = [];
  let outputPath;
  let pngPath;
  try {
    ({ outputPath, pngPath } = await run(['README.md', '--screenshot'], {
      cwd: directory,
      openFile: async () => {},
      warn: value => warnings.push(value),
      captureScreenshot: async () => Buffer.from('PNG'),
      copyImage: async () => { throw new Error('no clipboard'); },
    }));
    assert.match(warnings[0], new RegExp(pngPath));
    assert.equal(await fs.access(pngPath).then(() => true), true);
  } finally {
    await removeOutput(outputPath);
    await removeOutput(pngPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('loads a custom UTF-8 template', async () => {
  const directory = await fixture({
    'input.md': '# heading',
    'custom.html': '<body><h1>préfixe</h1>{{markdown}}</body>'
  });
  let outputPath;
  try {
    ({ outputPath } = await run(['input.md', '--template', 'custom.html'], {
      cwd: directory,
      openFile: async () => {}
    }));
    const output = await fs.readFile(outputPath, 'utf8');
    assert.match(output, /préfixe/);
    assert.match(output, /# heading/);
  } finally {
    await removeOutput(outputPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('retains generated HTML and reports its path when browser launch fails', async () => {
  const directory = await fixture({ 'input.md': '# heading' });
  const printed = [];
  let outputPath;
  try {
    await assert.rejects(
      run(['input.md'], {
        cwd: directory,
        print: value => printed.push(value),
        openFile: async () => { throw new Error('browser unavailable'); }
      }),
      error => error.exitCode === 1 && Boolean(error.outputPath)
    );
    outputPath = printed[0];
    assert.ok(outputPath);
    assert.equal(await fs.access(outputPath).then(() => true), true);
  } finally {
    await removeOutput(outputPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('does not create output when input cannot be read', async () => {
  const directory = await fixture({});
  try {
    await assert.rejects(run(['missing.md'], { cwd: directory, openFile: async () => {} }), error => error.exitCode === 1);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('default template resolves from the installed package location', async () => {
  const directory = await fixture({ 'input.md': '# heading' });
  let outputPath;
  try {
    ({ outputPath } = await run(['input.md'], { cwd: directory, openFile: async () => {} }));
    assert.match(await fs.readFile(outputPath, 'utf8'), /Markdown TOC/);
  } finally {
    await removeOutput(outputPath);
    await fs.rm(directory, { recursive: true, force: true });
  }
});
