#!/usr/bin/env node

import crypto from 'node:crypto';
import { realpathSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import open from 'open';
import { render } from './render.js';

const DEFAULT_TEMPLATE_URL = new URL('../templates/default.html', import.meta.url);

export class CliError extends Error {
  constructor(message, exitCode, outputPath = null) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
    this.outputPath = outputPath;
  }
}

export function parseArgs(argv) {
  let input = null;
  let template = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--template') {
      if (template !== null || index + 1 >= argv.length || argv[index + 1].startsWith('-')) {
        throw new CliError('Usage: toc <file.md> [--template <template.html>]', 2);
      }
      template = argv[++index];
    } else if (argument.startsWith('-')) {
      throw new CliError('Usage: toc <file.md> [--template <template.html>]', 2);
    } else if (input !== null) {
      throw new CliError('Usage: toc <file.md> [--template <template.html>]', 2);
    } else {
      input = argument;
    }
  }

  if (input === null || path.extname(input).toLowerCase() !== '.md') {
    throw new CliError('Expected exactly one Markdown file with a .md extension', 2);
  }
  return { input, template };
}

async function readTemplate(templatePath) {
  if (templatePath === null) {
    return fs.readFile(fileURLToPath(DEFAULT_TEMPLATE_URL), 'utf8');
  }
  return fs.readFile(templatePath, 'utf8');
}

async function writeExclusive(outputPath, contents) {
  await fs.writeFile(outputPath, contents, { encoding: 'utf8', flag: 'wx' });
}

export async function run(argv, {
  cwd = process.cwd(),
  print = console.log,
  openFile = open
} = {}) {
  const { input, template } = parseArgs(argv);
  const inputPath = path.resolve(cwd, input);
  const templatePath = template === null ? null : path.resolve(cwd, template);

  let markdown;
  let templateContents;
  try {
    [markdown, templateContents] = await Promise.all([
      fs.readFile(inputPath, 'utf8'),
      readTemplate(templatePath)
    ]);
  } catch (error) {
    throw new CliError(`Unable to read input or template: ${error.message}`, 1);
  }

  let html;
  try {
    html = render(templateContents, markdown);
  } catch (error) {
    throw new CliError(`Unable to render HTML: ${error.message}`, 1);
  }

  const inputBasename = path.basename(inputPath);
  const normalizedName = `${path.basename(inputBasename, path.extname(inputBasename))}.md.html`;
  const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}_${normalizedName}`);
  try {
    await writeExclusive(outputPath, html);
  } catch (error) {
    throw new CliError(`Unable to write generated HTML at ${outputPath}: ${error.message}`, 1, outputPath);
  }

  print(outputPath);
  try {
    await openFile(pathToFileURL(outputPath).href);
  } catch (error) {
    throw new CliError(`Unable to open generated HTML at ${outputPath}: ${error.message}`, 1, outputPath);
  }
  return { outputPath };
}

export async function main(argv = process.argv.slice(2), {
  print = console.log,
  error = console.error
} = {}) {
  try {
    await run(argv, { print });
    return 0;
  } catch (failure) {
    error(failure.message);
    if (failure.outputPath && !failure.message.includes(failure.outputPath)) {
      error(failure.outputPath);
    }
    return failure.exitCode === 2 ? 2 : 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  main().then(code => { process.exitCode = code; });
}
