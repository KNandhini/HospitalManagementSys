export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="pr-modal-overlay" onMouseDown={onCancel}>
      <div
        className="pr-modal pr-modal-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="pr-modal-header">
          <h2>{title}</h2>
        </div>
        <div className="pr-modal-body">
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
            {message}
          </p>
        </div>
        <div className="pr-modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
