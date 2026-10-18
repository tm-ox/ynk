import type { ImageMetadata } from "astro";
import { getCollection } from "astro:content";

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
  `Flyer for ${data.title}, ${data.date}`;

/** Fuller alt for a flyer on its own event page. */
export const flyerAlt = (data: EventData) =>
  `Flyer for ${data.title}, ${data.date}${place(data)}${
    data.with ? `, featuring ${data.with}` : ""
  }`;

/** One entry of the gallery: an event's flyer (first) or one of its photographs. */
export interface GalleryImage {
  id: string;
  src: ImageMetadata;
  alt?: string;
  kind: "flyer" | "photo";
  groupId: string;
  description: string;
  /** Photographs only: this one's place among the event's photographs. */
  position?: { n: number; of: number };
  /** The event the picture belongs to, for the info strip on its own page. */
  event: { id: string; title: string; date: string; venue?: { name?: string; url?: string } };
}

/** A photograph's own alt, where it says what is in the picture, leads its
 *  description ("Pestapora 2024, day 1: Sukatani. Photograph 3 of …"). Most
 *  events' photographs carry only the event's code or title (YNK#51,
 *  Nusasonic), which the description already names, so a one-word alt or the
 *  title itself adds nothing and is left out. */
const lead = (alt: string | undefined, title: string) =>
  alt && /\s/.test(alt.trim()) && alt !== title ? `${alt.trim()}. ` : "";

/** Every gallery photo, in event order, with a descriptive alt. */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  const events = await getCollection("events", ({ data }) => {
    return data.images && data.images.length > 0;
  });
  events.sort((b, a) => Date.parse(a.data.date) - Date.parse(b.data.date));
  return events.flatMap((event) => {
    const photos = (event.data.images ?? []).filter(Boolean) as any[];
    const groupId = groupSlug(event.data.title);
    const info = {
      id: event.id,
      title: event.data.title,
      date: event.data.date,
      venue: event.data.venue,
    };
    // The flyer leads the event's photographs (only events that have some).
    const flyer = event.data.flyer && {
      src: event.data.flyer.src,
      alt: event.data.title,
      id: `${event.data.id}-flyer`,
      kind: "flyer" as const,
      groupId,
      description: flyerAlt(event.data),
      event: info,
    };
    return [
      ...(flyer ? [flyer] : []),
      ...photos.map((image, i) => ({
        ...image,
        kind: "photo" as const,
        groupId,
        event: info,
        position: { n: i + 1, of: photos.length },
        description: `${lead(image.alt, event.data.title)}Photograph ${i + 1} of ${photos.length} from ${event.data.title}, ${event.data.date}${place(event.data)}`,
      })),
    ];
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
    group.count += (event.data.images ?? []).filter(Boolean).length + (event.data.flyer ? 1 : 0);
    groups.set(id, group);
  }
  return [...groups.values()].map((g) => ({
    id: g.id,
    label: `${g.title} / ${dateRange(g.date, g.last)}${g.venues.size === 1 ? ` / ${[...g.venues][0]}` : ""}`,
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

/** Paginated URLs from Astro may lack the trailing slash the site uses. */
/** Events per page in the events archive. */
export const EVENTS_PER_PAGE = 18;
export const IMAGES_PER_PAGE = 21;

export const slash = (url?: string) =>
    url && !url.endsWith("/") ? `${url}/` : url;

/** The home page's featured event: the nearest upcoming one, otherwise the most
 *  recent (decided at build time), with the label Featured gives it. */
export async function getFeaturedEvent() {
  // Jakarta (UTC+7) calendar date, so an event is "today" for the whole local day.
  const today = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);
  const events = await getCollection("events");
  const upcoming = events
    .filter((e) => e.data.date >= today)
    .sort((a, b) => Date.parse(a.data.date) - Date.parse(b.data.date));
  const latest = [...events].sort(
    (a, b) => Date.parse(b.data.date) - Date.parse(a.data.date),
  );
  const event = upcoming[0] ?? latest[0];
  return { event, label: upcoming[0] ? "Next event" : "Previous event" };
}
