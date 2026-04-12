import { getOriginMappings } from "@/app/actions/origin-mappings";
import { OriginMappingsView } from "./components/origin-mappings-view";

export default async function OriginMappingsPage() {
  const mappings = await getOriginMappings();

  return (
    <OriginMappingsView
      mappings={mappings.map((m) => ({
        id: m.id,
        matchValue: m.matchValue,
        sourceType: m.sourceType,
        label: m.label,
        createdAt: m.createdAt.toISOString(),
      }))}
    />
  );
}
