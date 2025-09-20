// app/events/create/page.tsx

import React, { Suspense } from "react";
import EventFormPage from "./EventFormPage";

export default function CreateEventPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading form...</div>}>
      <EventFormPage />
    </Suspense>
  );
}
