import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { formatPrice } from "../utils/formatPrice";
import { imageUrl } from "../utils/imageUrl";

const ReadSpecific = () => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await axios({
          url: `/product/${id}`,
          method: "GET",
        });
        if (data.data.result) setProduct(data.data.result);
        else setError("This product no longer exists.");
      } catch {
        setError("Could not load this product.");
      }
    };
    getData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    await axios({
      url: `/product/${id}`,
      method: "DELETE",
    });
    navigate("/read");
  };

  return (
    <div className="narrow-page">
      <Link to="/read" className="back-link">
        ← All products
      </Link>

      {error && <div className="alert">{error}</div>}

      {product && (
        <div className="card card-narrow">
          {product.image && (
            <img className="detail-image" src={imageUrl(product.image)} alt={product.name} />
          )}
          <div className="detail-head">
            <h1>{product.name}</h1>
            {product.isDamage ? (
              <span className="badge badge-danger">Damaged</span>
            ) : (
              <span className="badge badge-ok">Good</span>
            )}
          </div>

          <dl className="detail-list">
            <div>
              <dt>Quantity</dt>
              <dd>{product.quantity}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>{formatPrice(product.price)}</dd>
            </div>
            <div>
              <dt>Total value</dt>
              <dd>{formatPrice(product.price * product.quantity)}</dd>
            </div>
          </dl>

          <div className="detail-actions">
            <Link to={`/update/${id}`} className="btn btn-primary">
              Edit
            </Link>
            <button className="btn" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadSpecific;
