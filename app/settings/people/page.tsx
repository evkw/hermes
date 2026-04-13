import { getPeople } from "@/app/actions/people";
import { PeopleView } from "./components/people-view";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <PeopleView
      people={people.map((p) => ({
        id: p.id,
        name: p.name,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
