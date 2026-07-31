#!/usr/bin/env node

import crypto from 'node:crypto';
import { realpathSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import open from 'open';
import { render, renderForScreenshot } from './render.js';

const DEFAULT_TEMPLATE_URL = new URL('../templates/default.html', import.meta.url);

export class CliError extends Error {
  constructor(message, exitCode, outputPath = null, cause = undefined) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'CliError';
    this.exitCode = exitCode;
    this.outputPath = outputPath;
  }
}

export function parseArgs(argv) {
  let input = null;
  let template = null;
  let screenshot = false;
  let verbose = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--template') {
      if (template !== null || index + 1 >= argv.length || argv[index + 1].startsWith('-')) {
        throw new CliError('Usage: toc <file.md> [--template <template.html>] [--screenshot] [--verbose]', 2);
      }
      template = argv[++index];
    } else if (argument === '--screenshot') {
      if (screenshot) throw new CliError('Usage: toc <file.md> [--template <template.html>] [--screenshot] [--verbose]', 2);
      screenshot = true;
    } else if (argument === '--verbose') {
      if (verbose) throw new CliError('Usage: toc <file.md> [--template <template.html>] [--screenshot] [--verbose]', 2);
      verbose = true;
    } else if (argument.startsWith('-')) {
      throw new CliError('Usage: toc <file.md> [--template <template.html>] [--screenshot] [--verbose]', 2);
    } else if (input !== null) {
      throw new CliError('Usage: toc <file.md> [--template <template.html>] [--screenshot] [--verbose]', 2);
    } else {
      input = argument;
    }
  }

  if (input === null || path.extname(input).toLowerCase() !== '.md') {
    throw new CliError('Expected exactly one Markdown file with a .md extension', 2);
  }
  return { input, template, screenshot, verbose };
}

async function readTemplate(templatePath) {
  if (templatePath === null) {
    return fs.readFile(fileURLToPath(DEFAULT_TEMPLATE_URL), 'utf8');
  }
  return fs.readFile(templatePath, 'utf8');
}

async function writeExclusive(outputPath, contents) {
  await fs.writeFile(outputPath, contents, { flag: 'wx' });
}

export async function run(argv, {
  cwd = process.cwd(),
  print = console.log,
  warn = console.error,
  openFile = open,
  captureScreenshot,
  copyImage
} = {}) {
  const { input, template, screenshot, verbose } = parseArgs(argv);
  const log = message => { if (verbose) warn(`[toc] ${message}`); };
  const inputPath = path.resolve(cwd, input);
  const templatePath = template === null ? null : path.resolve(cwd, template);

  let markdown;
  let templateContents;
  log('Reading input and template');
  try {
    [markdown, templateContents] = await Promise.all([
      fs.readFile(inputPath, 'utf8'),
      readTemplate(templatePath)
    ]);
  } catch (error) {
    throw new CliError(`Unable to read input or template: ${error.message}`, 1, null, error);
  }

  let html;
  log('Rendering HTML');
  try {
    html = screenshot ? renderForScreenshot(templateContents, markdown) : render(templateContents, markdown);
  } catch (error) {
    throw new CliError(`Unable to render HTML: ${error.message}`, 1, null, error);
  }

  const inputBasename = path.basename(inputPath);
  const inputStem = path.basename(inputBasename, path.extname(inputBasename));
  const outputId = crypto.randomUUID();
  const normalizedName = `${inputStem}.md.html`;
  const outputPath = path.join(os.tmpdir(), `${outputId}_${normalizedName}`);
  log('Writing generated HTML');
  try {
    await writeExclusive(outputPath, html);
  } catch (error) {
    throw new CliError(`Unable to write generated HTML at ${outputPath}: ${error.message}`, 1, outputPath, error);
  }

  print(outputPath);
  log('Opening generated HTML');
  try {
    await openFile(pathToFileURL(outputPath).href);
  } catch (error) {
    throw new CliError(`Unable to open generated HTML at ${outputPath}: ${error.message}`, 1, outputPath, error);
  }

  if (!screenshot) {
    log('Complete');
    return { outputPath };
  }

  const capture = captureScreenshot ?? (await import('./screenshot.js')).captureTocScreenshot;
  const copy = copyImage ?? (await import('./clipboard.js')).copyImage;
  const pngName = `${outputId}_${inputStem}.md.toc.png`;
  const pngPath = path.join(os.tmpdir(), pngName);
  let pngBytes;
  log('Capturing TOC screenshot');
  try {
    pngBytes = await capture(html);
  } catch (error) {
    throw new CliError(`Unable to capture TOC screenshot: ${error.message}`, 1, outputPath, error);
  }
  log('Writing TOC screenshot');
  try {
    await writeExclusive(pngPath, pngBytes);
  } catch (error) {
    throw new CliError(`Unable to write TOC screenshot at ${pngPath}: ${error.message}`, 1, outputPath, error);
  }
  print(pngPath);
  log('Copying screenshot to clipboard');
  try {
    await copy(pngBytes);
  } catch (error) {
    warn(`Warning: unable to copy PNG to clipboard at ${pngPath}: ${error.message}`);
  }
  log('Complete');
  return { outputPath, pngPath };
}

export async function main(argv = process.argv.slice(2), {
  print = console.log,
  error = console.error,
  ...options
} = {}) {
  try {
    await run(argv, { ...options, print, warn: error });
    return 0;
  } catch (failure) {
    const verbose = argv.includes('--verbose');
    error(failure.message);
    if (failure.outputPath && !failure.message.includes(failure.outputPath)) {
      error(failure.outputPath);
    }
    if (verbose) error(failure.cause?.stack ?? failure.stack);
    return failure.exitCode === 2 ? 2 : 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  main().then(code => { process.exitCode = code; });
}
