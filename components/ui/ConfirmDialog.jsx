// components/ui/ConfirmDialog.jsx
// Minimal confirm/cancel modal — dark overlay + centered card. For any
// flow where leaving would silently discard in-progress work (currently:
// quitting the Assessment wizard before Finish).
//
// Usage:
//   <ConfirmDialog
//     open={showQuitConfirm}
//     title="Quit Assessment?"
//     message="Your progress on this assessment will not be saved."
//     confirmLabel="Quit"
//     cancelLabel="Keep Editing"
//     onConfirm={confirmQuit}
//     onCancel={cancelQuit}
//   />

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-dialog__overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <h2 className="confirm-dialog__title">{title}</h2>
        {message && <p className="confirm-dialog__message">{message}</p>}
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="detail-screen__action-btn detail-screen__action-btn--outline"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button type="button" className="detail-screen__action-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}