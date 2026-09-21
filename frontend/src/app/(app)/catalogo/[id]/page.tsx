import { notFound } from "next/navigation";

import { ContentDetails } from "@/components/content-details";

// Next 16: `params` é assíncrono.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentId = Number(id);
  if (!Number.isInteger(contentId) || contentId <= 0) notFound();
  return <ContentDetails id={contentId} />;
}
