import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ImagePicker from "./ImagePicker";

const CreateForm = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isDamage, setIsDamage] = useState(false);
  const [image, setImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    // FormData lets us send the picture file together with the other fields
    const formData = new FormData();
    formData.append("name", name);
    formData.append("quantity", quantity);
    formData.append("price", price);
    formData.append("isDamage", isDamage);
    if (image) formData.append("image", image);

    try {
      await axios({
        url: "/product",
        method: "POST",
        data: formData,
      });
      navigate("/read");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create the product. Is the backend running?",
      );
      setSaving(false);
    }
  };

  return (
    <div className="narrow-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">New product</h1>
          <p className="page-subtitle">Add an item to your inventory.</p>
        </div>
      </div>

      <form className="card card-narrow form" onSubmit={handleSubmit}>
        <ImagePicker file={image} onSelect={setImage} onRemove={() => setImage(null)} />

        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            className="input"
            type="text"
            id="name"
            placeholder="e.g. Wireless mouse"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="quantity">Quantity</label>
            <input
              className="input"
              type="number"
              id="quantity"
              min="0"
              placeholder="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="price">Price</label>
            <input
              className="input"
              type="number"
              id="price"
              min="0"
              step="0.01"
              placeholder="0.00"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>

        <label className="checkbox" htmlFor="isDamage">
          <input
            type="checkbox"
            id="isDamage"
            checked={isDamage}
            onChange={(e) => setIsDamage(e.target.checked)}
          />
          Damaged <span className="checkbox-hint">— mark if the item is faulty</span>
        </label>

        {error && <div className="alert">{error}</div>}

        <button className="btn btn-primary btn-block" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create product"}
        </button>
      </form>
    </div>
  );
};

export default CreateForm;
