# TOC CLI Design

## Purpose

`toc-builder` provides a cross-platform Markdown viewing command.

The installed command is `toc`.

It generates temporary Markdeep HTML with a long table.
It then opens that file using the default browser.

## Usage

```text
toc <file.md> [--template <template.html>]
```

The command accepts exactly one Markdown file.
The `.md` extension check is case-insensitive.

## Package

- npm package name: `toc-builder`
- executable name: `toc`
- module format: ESM
- minimum Node.js version: 20
- runtime dependency: `open`

Node.js standard modules handle every other responsibility.
No CLI framework or template engine is required.

## Architecture

`src/cli.js` owns orchestration:

- Parse arguments.
- Resolve input paths.
- Read UTF-8 files.
- Build the temporary output path.
- Write the rendered document.
- Print the generated path.
- Open the generated file URL.

`src/render.js` owns pure rendering:

- Validate the template contract.
- Insert the Markdeep footer.
- Replace the Markdown placeholder.

`templates/default.html` stores the default document structure.

## Template Contract

Templates are complete HTML documents.

Each template must contain exactly one `{{markdown}}` placeholder.
The placeholder must appear inside the document body.
The template must contain one closing `</body>` tag.

The CLI owns the Markdeep scripts.
Custom templates must not provide another Markdeep loader.

The default template has this structure:

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

## Markdeep Footer

Markdeep expects its loader after the Markdown content.
The CLI inserts this footer before `</body>`:

```html
<script>window.markdeepOptions = {tocStyle: 'long'};</script>
<script src="https://morgan3d.github.io/markdeep/latest/markdeep.min.js" charset="utf-8"></script>
```

The CLI inserts this footer before Markdown replacement.
This prevents Markdown text from changing the insertion point.

Markdown content is inserted without HTML escaping.
Markdeep supports raw HTML inside Markdown documents.

## Data Flow

1. Parse the positional path and optional template.
2. Resolve paths from the current working directory.
3. Validate the input `.md` extension.
4. Read Markdown using UTF-8.
5. Read the selected template using UTF-8.
6. Validate the template contract.
7. Insert the owned Markdeep footer.
8. Replace `{{markdown}}` with unchanged Markdown content.
9. Generate the output filename.
10. Write the file inside `os.tmpdir()`.
11. Print the generated absolute path.
12. Open its file URL using `open`.
13. Leave cleanup to the operating system.

## Output Naming

Use `crypto.randomUUID()` for collision resistance.

For input `README.md`, output uses this pattern:

```text
<random-uuid>_README.md.html
```

The full output path lives under `os.tmpdir()`.
Writing should use exclusive file creation.

## Errors

Exit code `2` reports invalid arguments or unsupported inputs.
Exit code `1` reports operational failures.

Validation failures create no output file.
Read failures create no output file.
Write failures report the attempted destination.

Launch failures retain the generated HTML.
They also print its path for manual opening.

Errors remain concise and omit stack traces.

## Security

Markdown and custom templates are trusted local content.
Raw HTML may execute inside the local browser.

Viewing requires internet access for Markdeep.
The remote `latest` script may change unexpectedly.

## Testing

Use Node.js built-in test tooling.

Unit tests cover:

- Argument combinations.
- Unknown or duplicate options.
- Case-insensitive `.md` validation.
- UUID output naming.
- Missing or duplicate placeholders.
- Placeholder placement outside the body.
- Markdeep footer ordering.
- Unchanged Markdown insertion.
- Browser launch conditions.
- Exit code mapping.

Integration tests cover:

- Temporary file creation.
- Unicode and spaced input paths.
- Custom template loading.
- Generated file retention.
- Browser launch failure handling.

Automated tests mock browser launching.
Tests never download the live Markdeep script.

Cross-platform smoke tests may run during releases.

## Non-Goals

- Batch processing.
- Watch mode.
- Temporary file deletion.
- Bundled offline Markdeep.
- Static Markdeep export.
- Browser rendering verification.
- Additional output formats.

## Success Criteria

- `toc README.md` opens generated temporary HTML.
- Generated HTML requests a long Markdeep table.
- Output naming matches the documented UUID pattern.
- `--template` replaces the default document structure.
- Invalid templates fail before output creation.
- Launch failures preserve a manually openable file.
- Tests run without opening a real browser.
