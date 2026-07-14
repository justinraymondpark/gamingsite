export type SpoilerSegment =
  | { type: 'text'; content: string }
  | { type: 'spoiler'; content: string };

const TOKEN_START = '\uE000spoiler:';
const TOKEN_END = '\uE001';

type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

export function splitSpoilers(content: string): SpoilerSegment[] {
  const segments: SpoilerSegment[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const start = content.indexOf('||', cursor);

    if (start === -1) {
      segments.push({ type: 'text', content: content.slice(cursor) });
      break;
    }

    const end = content.indexOf('||', start + 2);

    if (end === -1) {
      segments.push({ type: 'text', content: content.slice(cursor) });
      break;
    }

    if (start > cursor) {
      segments.push({ type: 'text', content: content.slice(cursor, start) });
    }

    const spoiler = content.slice(start + 2, end);
    if (spoiler) {
      segments.push({ type: 'spoiler', content: spoiler });
    } else {
      segments.push({ type: 'text', content: '||||' });
    }

    cursor = end + 2;
  }

  return segments;
}

export function tokenizeSpoilers(content: string): {
  content: string;
  spoilers: string[];
} {
  const spoilers: string[] = [];
  const tokenized = splitSpoilers(content)
    .map((segment) => {
      if (segment.type === 'text') return segment.content;

      const index = spoilers.push(segment.content) - 1;
      return `${TOKEN_START}${index}${TOKEN_END}`;
    })
    .join('');

  return { content: tokenized, spoilers };
}

export function createRemarkSpoilerPlugin(spoilers: string[]) {
  return function remarkSpoilers() {
    return function transform(tree: MarkdownNode) {
      replaceSpoilerTokens(tree, spoilers);
    };
  };
}

function replaceSpoilerTokens(node: MarkdownNode, spoilers: string[]) {
  if (!node.children) return;

  node.children = node.children.flatMap((child) => {
    if (child.type !== 'text' || !child.value) {
      replaceSpoilerTokens(child, spoilers);
      return child;
    }

    const tokenPattern = new RegExp(`${TOKEN_START}(\\d+)${TOKEN_END}`, 'g');
    const replacements: MarkdownNode[] = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenPattern.exec(child.value)) !== null) {
      if (match.index > cursor) {
        replacements.push({
          type: 'text',
          value: child.value.slice(cursor, match.index),
        });
      }

      const spoiler = spoilers[Number(match[1])];
      if (spoiler === undefined) {
        replacements.push({ type: 'text', value: match[0] });
      } else {
        replacements.push({
          type: 'spoiler',
          data: {
            hName: 'span',
            hProperties: { className: ['spoiler-marker'] },
          },
          children: [{ type: 'text', value: spoiler }],
        });
      }

      cursor = match.index + match[0].length;
    }

    if (cursor === 0) return child;

    if (cursor < child.value.length) {
      replacements.push({ type: 'text', value: child.value.slice(cursor) });
    }

    return replacements;
  });
}
