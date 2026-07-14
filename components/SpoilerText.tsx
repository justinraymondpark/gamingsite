import { Fragment } from 'react';
import Spoiler from '@/components/Spoiler';
import { splitSpoilers } from '@/lib/spoilers';

type SpoilerTextProps = {
  children: string;
};

export default function SpoilerText({ children }: SpoilerTextProps) {
  return splitSpoilers(children).map((segment, index) => (
    <Fragment key={`${segment.type}-${index}`}>
      {segment.type === 'spoiler' ? (
        <Spoiler>{segment.content}</Spoiler>
      ) : (
        segment.content
      )}
    </Fragment>
  ));
}
