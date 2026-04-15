import { getStreams } from "@/app/actions/streams";
import { StreamsView } from "./components/streams-view";

export const dynamic = "force-dynamic";

export default async function StreamsPage() {
  const streams = await getStreams();

  return (
    <StreamsView
      streams={streams.map((s) => ({
        id: s.id,
        key: s.key,
        name: s.name,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
