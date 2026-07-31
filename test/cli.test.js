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
  assert.deepEqual(parseArgs(['README.MD']), { input: 'README.MD', template: null });
  assert.deepEqual(parseArgs(['README.md', '--template', 'custom.html']), {
    input: 'README.md',
    template: 'custom.html'
  });
});

test('rejects invalid argument combinations with exit code 2', () => {
  for (const argv of [
    [],
    ['one.md', 'two.md'],
    ['one.txt'],
    ['one.md', '--unknown'],
    ['one.md', '--template'],
    ['one.md', '--template', 'a.html', '--template', 'b.html']
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
