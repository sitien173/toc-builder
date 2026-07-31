# toc-builder

`toc-builder` is a cross-platform Markdown viewer that generates a temporary
Markdeep HTML document with a long table of contents and opens it in your
default browser.

## Install

```sh
npm install --global toc-builder
```

The installation provides the `toc` command.

## Usage

Open a Markdown file:

```sh
toc README.md
```

Use a custom HTML template:

```sh
toc README.md --template docs-template.html
```

Enable opt-in lifecycle diagnostics with `--verbose`; it may appear anywhere in
an otherwise valid command line:

```sh
toc --verbose README.md
toc README.md --screenshot --verbose
```

Verbose messages are written to standard error. Standard output remains limited
to the generated path(s), so existing consumers remain compatible.

The input path must be exactly one file whose extension is `.md` (the extension
check is case-insensitive). Relative paths are resolved from the current
working directory.

On success, `toc` prints the absolute generated path. For `README.md`, the
filename has this form:

```text
<uuid>_README.md.html
```

The file is created directly inside the operating system's temporary directory
and is intentionally retained. You can open the printed path manually or
remove it when you no longer need it.

## Screenshots

Add `--screenshot` to capture the rendered `.longTOC` element and copy its PNG
to the desktop clipboard:

```sh
toc README.md --screenshot
toc README.md --template docs-template.html --screenshot
```

Screenshot mode prints two absolute paths, in order:

```text
<uuid>_README.md.html
<uuid>_README.md.toc.png
```

Both files use the same UUID, are created directly in the system temporary
directory with exclusive creation, and are intentionally retained after
success or later screenshot failures. The HTML is opened first; screenshot
capture does not start if opening the HTML fails. Screenshot mode uses an
installed Chrome or Chromium browser. Set `TOC_BROWSER_PATH` when automatic
discovery cannot find its executable.

Clipboard support requires a desktop Windows, macOS, or Linux session (Linux
needs an active X11 or Wayland compositor). Clipboard failures are warning-only:
the PNG remains available and the command still succeeds. Screenshot capture,
browser, and PNG-write failures return exit code 1; invalid arguments return 2.

An explicit real-clipboard smoke test is available with
`npm run test:clipboard-smoke`. It is excluded from `npm test` and CI, requires
an active desktop clipboard session, and mutates the real desktop clipboard;
run it only when that side effect is intentional.

Markdown and templates are trusted content. Screenshot mode executes that
content in both the default browser and a second headless browser, so scripts
with side effects can run twice. Do not use screenshot mode for untrusted
files. Markdeep remains remote and mutable; compatibility can change when its
`latest` build changes.

## Templates

Templates are complete HTML documents. A custom template must:

- contain exactly one literal `{{markdown}}` placeholder;
- place that placeholder inside exactly one `<body>...</body>` region; and
- contain exactly one closing `</body>` tag.

The CLI owns the Markdeep footer, so custom templates must not add another
Markdeep loader. Markdown is inserted without HTML escaping, including raw HTML
and literal content.

The default template is equivalent to:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Markdown TOC</title>
</head>
<body>
{{markdown}}
</body>
</html>
```

## Troubleshooting and security

If the browser cannot be launched, the generated HTML is retained and its path
is printed so it can be opened manually. For screenshot troubleshooting, first
open the retained HTML path and verify internet access and that exactly one long
TOC is rendered. If no browser is found, install Chrome or Chromium, or set
`TOC_BROWSER_PATH` to its executable. On headless Linux, use the regular HTML
mode or provide a desktop X11/Wayland session for clipboard support.

Invalid arguments return exit code 2; file, template, rendering, writing, and
browser failures return exit code 1. Clipboard failures only warn. Errors are
concise and do not include stack traces by default; `--verbose` adds a stack
trace for fatal failures. Clipboard warnings remain concise and never include
stack traces.

Markdeep is loaded from the remote URL
`https://morgan3d.github.io/markdeep/latest/markdeep.min.js`, so viewing
requires internet access. The remote `latest` script may change over time.

Markdown files and custom templates are trusted local content. Raw HTML in
those files can execute in the local browser; do not view untrusted content
with this tool.

## Development

Run the tests with Node.js 20 or newer:

```sh
npm test
```

Tests mock browser launching and never open a real browser or download
Markdeep. Tests never publish the package.

## Publishing

Publishing uses npm trusted publishing through GitHub Actions. The workflow
requires npm CLI 11.5.1 or newer and Node.js 22.14.0 or newer.

Publish version `0.1.0` manually once to create the package:

```sh
npm login
npm ci
npm test
npm publish --access public
```

Authorize the GitHub workflow afterward:

```sh
npm trust github toc-builder \
  --repo sitien173/toc-builder \
  --file publish.yml \
  --allow-publish
```

Future releases publish when version tags reach GitHub:

```sh
npm version patch
git push origin main --follow-tags
```

Use `minor` or `major` when required. The workflow verifies the tag matches
`package.json`, runs tests, and publishes with npm provenance.
