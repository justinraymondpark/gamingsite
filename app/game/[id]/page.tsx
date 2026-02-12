import GamePageClient from './GamePageClient';

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function GamePage() {
  return <GamePageClient />;
}
