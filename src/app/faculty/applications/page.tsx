import type { Metadata } from 'next';
import { ApplicationReviewPage } from '@/components/application-review-page';
export const metadata: Metadata = { title: 'Student applications | CS-GAMUERS' };
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ApplicationReviewPage role="faculty" searchParams={searchParams} />;
}
