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
      groupId: groupSlug(event.data.title),
      description: `Photograph ${i + 1} of ${photos.length} from ${event.data.title}, ${prettyDate(event.data.date)}${place(event.data)}`,
    }));
  });
}

/** Gallery filter groups sub-events under one title: YNK#38.1, .3 ... become YNK#38. */
export const groupTitle = (title: string) =>
  title.replace(/\.\d+$/, "").replace(/ \d$/, "");

export const groupSlug = (title: string) =>
  groupTitle(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Same ISO format as the event pages; ranges show both ends in full. */
const dateRange = (first: string, last: string) =>
  first === last ? first : `${first} – ${last}`;

/** Events with gallery photos grouped for the gallery filter, newest first. */
export async function getGalleryEvents() {
  const events = await getCollection("events", ({ data }) => {
    return data.images && data.images.length > 0;
  });
  events.sort((b, a) => Date.parse(a.data.date) - Date.parse(b.data.date));
  const groups = new Map<
    string,
    { id: string; title: string; date: string; last: string; venues: Set<string>; count: number }
  >();
  for (const event of events) {
    const id = groupSlug(event.data.title);
    const group = groups.get(id) ?? {
      id,
      title: groupTitle(event.data.title),
      date: event.data.date,
      last: event.data.date,
      venues: new Set<string>(),
      count: 0,
    };
    if (Date.parse(event.data.date) < Date.parse(group.date))
      group.date = event.data.date;
    if (Date.parse(event.data.date) > Date.parse(group.last))
      group.last = event.data.date;
    if (event.data.venue?.name) group.venues.add(event.data.venue.name);
    group.count += (event.data.images ?? []).filter(Boolean).length;
    groups.set(id, group);
  }
  return [...groups.values()].map((g) => ({
    id: g.id,
    label: `${g.title} · ${dateRange(g.date, g.last)}${g.venues.size === 1 ? ` · ${[...g.venues][0]}` : ""}`,
    count: g.count,
  }));
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

export type GalleryImage = Awaited<ReturnType<typeof getGalleryImages>>[number];

/** Paginated URLs from Astro may lack the trailing slash the site uses. */
export const slash = (url?: string) =>
    url && !url.endsWith("/") ? `${url}/` : url;
