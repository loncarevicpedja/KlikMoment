import { EventForm } from "@/components/admin/event-form";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">Create event</h1>
      <p className="mt-1 text-slate-600">Set up a new event and invite the owner.</p>
      <div className="mt-8 max-w-3xl">
        <EventForm />
      </div>
    </div>
  );
}
