import { getCollection } from "astro:content";

export const prettyDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

type EventData = {
  title: string;
  date: string;
  venue?: { name?: string; url?: string };
  with?: string;
};

const place = (data: EventData) =>
  data.venue?.name ? ` at ${data.venue.name}` : "";

/** Short alt for flyer thumbnails in listings. */
export const flyerAltShort = (data: EventData) =>
  `Flyer for ${data.title}, ${prettyDate(data.date)}`;

/** Fuller alt for a flyer on its own event page. */
export const flyerAlt = (data: EventData) =>
  `Flyer for ${data.title}, ${prettyDate(data.date)}${place(data)}${
    data.with ? `, featuring ${data.with}` : ""
  }`;

/** Every gallery photo, in event order, with a descriptive alt. */
export async function getGalleryImages() {
  const events = await getCollection("events", ({ data }) => {
    return data.images && data.images.length > 0;
  });
  events.sort((b, a) => Date.parse(a.data.date) - Date.parse(b.data.date));
  return events.flatMap((event) => {
    const photos = (event.data.images ?? []).filter(Boolean) as any[];
    return photos.map((image, i) => ({
      ...image,
      description: `Photograph ${i + 1} of ${photos.length} from ${event.data.title}, ${prettyDate(event.data.date)}${place(event.data)}`,
    }));
  });
}

/** schema.org Event for an event page. Indonesian events, so UTC+7. */
export function eventJsonLd(
  data: EventData & { time?: string },
  url: string,
  imageUrl?: string,
  description?: string,
) {
  const t = data.time?.match(/^(\d{1,2})[.:](\d{2})$/);
  const startDate = t
    ? `${data.date}T${t[1].padStart(2, "0")}:${t[2]}:00+07:00`
    : data.date;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: data.title,
    startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
    ...(description && { description }),
    ...(imageUrl && { image: [imageUrl] }),
    ...(data.venue?.name && {
      location: {
        "@type": "Place",
        name: data.venue.name,
        ...(data.venue.url && { url: data.venue.url }),
      },
    }),
    organizer: { "@type": "Organization", name: "Yes No Klub", url: "https://www.yesnoklub.net/" },
  };
}
