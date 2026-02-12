import ReviewPageClient from './ReviewPageClient';

export async function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ReviewPage() {
  return <ReviewPageClient />;
}
