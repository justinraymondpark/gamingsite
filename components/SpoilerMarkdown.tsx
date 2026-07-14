'use client';

import { useMemo } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import Spoiler from '@/components/Spoiler';
import { createRemarkSpoilerPlugin, tokenizeSpoilers } from '@/lib/spoilers';

type SpoilerMarkdownProps = {
  children: string;
  components?: Components;
};

export default function SpoilerMarkdown({ children, components }: SpoilerMarkdownProps) {
  const tokenized = useMemo(() => tokenizeSpoilers(children), [children]);
  const remarkSpoilers = useMemo(
    () => createRemarkSpoilerPlugin(tokenized.spoilers),
    [tokenized.spoilers]
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkSpoilers]}
      components={{
        ...components,
        span: ({ className, children: spanChildren, ...props }) =>
          className === 'spoiler-marker' ? (
            <Spoiler>{spanChildren}</Spoiler>
          ) : (
            <span className={className} {...props}>{spanChildren}</span>
          ),
      }}
    >
      {tokenized.content}
    </ReactMarkdown>
  );
}
