const MARKDOWN_PLACEHOLDER = '{{markdown}}';
const OPEN_BODY_RE = /<body(?:\s[^>]*)?>/gi;
const CLOSE_BODY_RE = /<\/body\s*>/gi;

export const MARKDEEP_FOOTER = `<script>window.markdeepOptions = {tocStyle: 'long'};</script>\n<script src="https://morgan3d.github.io/markdeep/latest/markdeep.min.js" charset="utf-8"></script>`;

export function validateTemplate(template) {
  if (typeof template !== 'string') {
    throw new TypeError('Template must be a string');
  }

  const placeholderCount = template.split(MARKDOWN_PLACEHOLDER).length - 1;
  if (placeholderCount !== 1) {
    throw new Error('Template must contain exactly one {{markdown}} placeholder');
  }

  const openings = [...template.matchAll(OPEN_BODY_RE)];
  const closings = [...template.matchAll(CLOSE_BODY_RE)];
  if (openings.length !== 1) {
    throw new Error('Template must contain one body region');
  }
  if (closings.length !== 1) {
    throw new Error('Template must contain exactly one closing body tag');
  }

  const bodyStart = openings[0].index + openings[0][0].length;
  const bodyEnd = closings[0].index;
  const placeholderIndex = template.indexOf(MARKDOWN_PLACEHOLDER);
  if (placeholderIndex < bodyStart || placeholderIndex + MARKDOWN_PLACEHOLDER.length > bodyEnd) {
    throw new Error('The {{markdown}} placeholder must appear inside the body');
  }

  return true;
}

export function render(template, markdown) {
  validateTemplate(template);
  if (typeof markdown !== 'string') {
    throw new TypeError('Markdown must be a string');
  }

  const withFooter = template.replace(CLOSE_BODY_RE, `${MARKDEEP_FOOTER}</body>`);
  return withFooter.replace(MARKDOWN_PLACEHOLDER, markdown);
}
