import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ImagePicker from "./ImagePicker";
import { imageUrl } from "../utils/imageUrl";

const UpdateForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [isDamage, setIsDamage] = useState(false);
  const [existingImage, setExistingImage] = useState(null); // saved picture path
  const [image, setImage] = useState(null); // newly chosen file
  const [removeExisting, setRemoveExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await axios({
          url: `http://localhost:8000/product/${id}`,
          method: "GET",
        });
        const product = data.data.result;
        setName(product.name);
        setQuantity(product.quantity);
        setPrice(product.price);
        setIsDamage(Boolean(product.isDamage));
        setExistingImage(product.image || null);
      } catch {
        setError("Could not load this product.");
      }
    };
    getData();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("quantity", quantity);
    formData.append("price", price);
    formData.append("isDamage", isDamage);
    if (image) formData.append("image", image);
    else if (removeExisting && existingImage) formData.append("removeImage", "true");

    try {
      await axios({
        url: `http://localhost:8000/product/${id}`,
        method: "PATCH",
        data: formData,
      });
      navigate(`/readSpecific/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save changes. Is the backend running?");
      setSaving(false);
    }
  };

  return (
    <div className="narrow-page">
      <Link to={`/readSpecific/${id}`} className="back-link">
        ← Back to product
      </Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit product</h1>
          <p className="page-subtitle">Update the details and save.</p>
        </div>
      </div>

      <form className="card card-narrow form" onSubmit={handleSubmit}>
        <ImagePicker
          file={image}
          currentUrl={removeExisting ? null : imageUrl(existingImage)}
          onSelect={setImage}
          onRemove={() => {
            setImage(null);
            setRemoveExisting(true);
          }}
        />

        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            className="input"
            type="text"
            id="name"
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
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
};

export default UpdateForm;
