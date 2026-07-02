// components/community/AnnouncementCard.jsx
import Image from "next/image";

/**
 * AnnouncementCard
 *
 * Props:
 * - type: string        e.g. "INSPECTION IN PROGRESS"
 * - title: string       e.g. "Mabini Elementary School"
 * - location: string    e.g. "San Jose del Monte, Bulacan"
 * - body: string        announcement text
 * - postedBy: string    e.g. "San Jose Engineering Office"
 * - postedAt: string    e.g. "1min ago"
 * - photoUrl?: string   optional. If present, a photo is shown below the text.
 */
export default function AnnouncementCard({
  type,
  title,
  location,
  body,
  postedBy,
  postedAt,
  photoUrl,
}) {
  return (
    <div className="announcement-card">
        <div className="announcement-card__header">
            <div className="announcement-card__type">{type}</div>
            <div className="announcement-card__time">{postedAt}</div>
        </div>

      <p className="announcement-card__title">{title}</p>
      <p className="announcement-card__location">
        <i className="fa-solid fa-location-dot" aria-hidden="true" />
        {location}
      </p>
      <p className="announcement-card__body">{body}</p>
      <p className="announcement-card__posted-by">
        <i className="fa-solid fa-circle-check" aria-hidden="true" />
        Posted by {postedBy}
      </p>

      {photoUrl && (
        <div className="announcement-card__photo-wrap">
          <Image
            src={photoUrl}
            alt={title}
            fill
            className="announcement-card__photo"
            sizes="(max-width: 600px) 100vw, 600px"
          />
        </div>
      )}
    </div>
  );
}