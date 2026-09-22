import { EventForm } from "@/components/admin/event-form";
import { sr } from "@/content/sr";

export default function NewEventPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{sr.admin.createEvent}</h1>
      <p className="mt-1 text-slate-600">
        Podesite novi događaj i pozovite vlasnika.
      </p>
      <div className="mt-8 max-w-3xl">
        <EventForm />
      </div>
    </div>
  );
}
