"use client";

// components/community/AnnouncementCard.jsx
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
    </div>
  );
}