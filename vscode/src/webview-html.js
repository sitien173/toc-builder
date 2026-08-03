import { PROTOCOL_VERSION } from './protocol.js';

function safeEncodeURI(uri) {
  if (!uri) return '';
  // Encode non-ASCII characters once without double-encoding or stripping ASCII
  return uri.replace(/[^\x00-\x7F]+/g, (match) => encodeURI(match));
}

export function prepareWebviewHtml(renderedHtml, options = {}) {
  const { cspSource = '', baseUri = '', revision = 0, sourceUri = '' } = options;

  // Remove existing template-supplied CSP metas
  const cleanedHtml = renderedHtml.replace(
    /<meta\s+http-equiv=["']?content-security-policy["']?[^>]*>/gi,
    ''
  );

  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://morgan3d.github.io; style-src ${cspSource} 'unsafe-inline'; img-src ${cspSource} data: https:; font-src ${cspSource} data: https:; form-action 'none'; object-src 'none'; frame-src 'none';">`;

  let baseTag = '';
  if (baseUri) {
    const encodedBaseUri = safeEncodeURI(baseUri);
    const uri = encodedBaseUri.endsWith('/') ? encodedBaseUri : `${encodedBaseUri}/`;
    baseTag = `<base href="${uri}">`;
  }

  const safeSourceUri = safeEncodeURI(sourceUri);
  const state = {
    protocol: PROTOCOL_VERSION,
    sourceUri: safeSourceUri,
    revision,
  };
  const safeStateJson = JSON.stringify(state).replace(/</g, '\\u003c');

  const bootstrapScript = `<script>
(function() {
  const vscode = acquireVsCodeApi();
  const state = ${safeStateJson};
  vscode.setState(state);
  window.addEventListener('load', function() {
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function() {
      requestAnimationFrame(function() {
        const tocCount = document.querySelectorAll('.longTOC').length;
        vscode.postMessage({
          protocol: 1,
          type: 'ready',
          revision: state.revision,
          tocCount: tocCount
        });
      });
    });
  });
})();
</script>`;

  const insertions = `${cspMeta}${baseTag}${bootstrapScript}`;

  const headMatch = cleanedHtml.match(/<head(?:\s[^>]*)?>/i);
  if (headMatch) {
    const insertIndex = headMatch.index + headMatch[0].length;
    return (
      cleanedHtml.slice(0, insertIndex) +
      insertions +
      cleanedHtml.slice(insertIndex)
    );
  }

  return insertions + cleanedHtml;
}
