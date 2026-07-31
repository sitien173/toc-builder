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
is printed so it can be opened manually. Invalid arguments return exit code 2;
file, template, rendering, writing, and browser failures return exit code 1.
Errors are concise and do not include stack traces.

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
Markdeep. The package is not published automatically by this project.
