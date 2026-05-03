import { XIcon } from "@/components/icons";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1055 }}>
      <div className="modal-card card shadow-lg w-100" style={{ maxWidth: "960px", maxHeight: "85vh" }}>
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 className="h5 mb-0">{title}</h2>
          <button
            onClick={onClose}
            className="btn btn-outline-secondary btn-sm"
            aria-label="Close"
            title="Close"
          >
            <XIcon />
          </button>
        </div>

        <div className="card-body overflow-auto">{children}</div>
      </div>
    </div>
  );
}
