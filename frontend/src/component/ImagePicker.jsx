import { useEffect, useMemo, useRef, useState } from "react";

const MAX_SIZE = 5 * 1024 * 1024; // must match the backend limit

/**
 * Picture field for the product forms.
 * - file: the newly chosen File (or null)
 * - currentUrl: URL of the picture already saved (edit form), or null
 * - onSelect(file): called when a valid image is chosen
 * - onRemove(): called when the user removes the picture
 */
const ImagePicker = ({ file, currentUrl, onSelect, onRemove }) => {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const shown = preview || currentUrl;

  const pick = (chosen) => {
    if (!chosen) return;
    if (!chosen.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, WebP…).");
      return;
    }
    if (chosen.size > MAX_SIZE) {
      setError("Image is too large. Max size is 5 MB.");
      return;
    }
    setError("");
    onSelect(chosen);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="field">
      <span className="field-label">Picture</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pick(e.target.files[0]);
          e.target.value = ""; // allow picking the same file again
        }}
      />

      {shown ? (
        <div className="image-picked">
          <img src={shown} alt="Product preview" />
          <div className="image-picked-actions">
            <button type="button" className="btn" onClick={openPicker}>
              Change
            </button>
            <button
              type="button"
              className="btn btn-ghost danger"
              onClick={() => {
                setError("");
                onRemove();
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`dropzone${dragging ? " dragging" : ""}`}
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files[0]);
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
          </svg>
          <span className="dropzone-title">Add picture</span>
          <span className="dropzone-hint">Click or drag an image here · up to 5 MB</span>
        </button>
      )}

      {error && <div className="alert">{error}</div>}
    </div>
  );
};

export default ImagePicker;
