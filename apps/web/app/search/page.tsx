import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchPageProps = Readonly<{
  searchParams: Promise<{ q?: string; cuisine?: string }>;
}>;

const CUISINES = new Set([
  "korean",
  "noodle",
  "japanese",
  "chinese",
  "western",
  "cafe",
]);

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100);
  const cuisine =
    params.cuisine && CUISINES.has(params.cuisine) ? params.cuisine : undefined;
  const search = new URLSearchParams();

  if (query) search.set("q", query);
  if (cuisine) search.set("cuisine", cuisine);

  redirect(`/r${search.size ? `?${search.toString()}` : ""}`);
}
