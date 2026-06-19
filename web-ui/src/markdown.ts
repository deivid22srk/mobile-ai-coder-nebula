// Lightweight markdown renderer — converts a subset of markdown to HTML.
// We avoid pulling in a full markdown lib to keep the bundle small.
// Supports: headings, bold, italic, inline code, code blocks (```), links,
// lists (ul/ol), paragraphs, line breaks.

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(input: string): string {
  if (!input) return '';

  const lines = input.split('\n');
  const html: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';
  let inList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (inList) {
      html.push(`</${inList}>`);
      inList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code fence
    const fence = line.match(/^```(\w+)?/);
    if (fence) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = fence[1] || '';
        codeBuffer = [];
      } else {
        // close
        const code = escapeHtml(codeBuffer.join('\n'));
        const cls = codeLang ? ` class="language-${codeLang}"` : '';
        html.push(`<pre><code${cls}>${code}</code></pre>`);
        inCodeBlock = false;
        codeLang = '';
        codeBuffer = [];
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length + 2; // h3..h6
      html.push(`<h${level}>${inlineMd(heading[2])}</h${level}>`);
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      closeList();
      html.push('<hr/>');
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList();
        html.push('<ul>');
        inList = 'ul';
      }
      html.push(`<li>${inlineMd(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list
    const olMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        html.push('<ol>');
        inList = 'ol';
      }
      html.push(`<li>${inlineMd(olMatch[1])}</li>`);
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p>${inlineMd(line)}</p>`);
  }

  closeList();

  // Close any unclosed code block
  if (inCodeBlock && codeBuffer.length > 0) {
    const code = escapeHtml(codeBuffer.join('\n'));
    html.push(`<pre><code>${code}</code></pre>`);
  }

  return html.join('');
}

function inlineMd(text: string): string {
  let out = escapeHtml(text);
  // Inline code (do this first so its content doesn't get formatted)
  out = out.replace(/`([^`]+?)`/g, (_, code) => `<code>${code}</code>`);
  // Bold
  out = out.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+?)__/g, '<strong>$1</strong>');
  // Italic
  out = out.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  out = out.replace(/_([^_]+?)_/g, '<em>$1</em>');
  // Links [text](url)
  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  return out;
}
