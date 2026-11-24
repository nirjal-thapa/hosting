import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ActionMenu from "./ActionMenu";
import { formatPrice } from "../utils/formatPrice";
import { imageUrl } from "../utils/imageUrl";

// Remember the chosen view (table / grid) in this browser
const loadView = () => {
  try {
    return localStorage.getItem("productView") === "grid" ? "grid" : "table";
  } catch {
    return "table";
  }
};

const ImageIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L5 21" />
  </svg>
);

const Condition = ({ damaged }) => (
  <span className={`pill${damaged ? " pill-danger" : ""}`}>{damaged ? "Damaged" : "Good"}</span>
);

const ReadAll = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState(loadView);
  const navigate = useNavigate();

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await axios({
          url: "http://localhost:8000/product",
          method: "GET",
        });
        setProducts(data.data.result);
        setError("");
      } catch {
        setError("Could not load products. Is the backend running?");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [reload]);

  const changeView = (next) => {
    setView(next);
    try {
      localStorage.setItem("productView", next);
    } catch {
      // storage unavailable; the view just won't be remembered
    }
  };

  const handleView = (_id) => () => navigate(`/readSpecific/${_id}`);
  const handleUpdate = (_id) => () => navigate(`/update/${_id}`);

  const handleDelete = (product) => async () => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    await axios({
      url: `http://localhost:8000/product/${product._id}`,
      method: "DELETE",
    });
    setReload((n) => n + 1);
  };

  // Apply search, condition filter and sorting
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesSearch = !query || String(p.name).toLowerCase().includes(query);
      const matchesCondition =
        condition === "all" || (condition === "damaged") === Boolean(p.isDamage);
      return matchesSearch && matchesCondition;
    });
    if (sort === "newest") list.reverse();
    if (sort === "name") list.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, search, condition, sort]);

  const count = products.length;

  return (
    <>
      <section className="page-hero">
        <div className="page-header">
          <div>
            <h1 className="page-title page-title-lg">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 12 10 5 10-5-2.4-1.2L12 14.6l-7.6-3.8L2 12Z" />
                <path d="m2 17 10 5 10-5-2.4-1.2L12 19.6l-7.6-3.8L2 17Z" />
              </svg>
              Products
            </h1>
            <p className="page-subtitle">Here you can find and manage all your products</p>
          </div>
          <Link to="/create" className="btn btn-primary">
            + New Product
          </Link>
        </div>
      </section>

      <div className="filters">
        <div className="field">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            className="input"
            type="search"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="condition">Condition</label>
          <select
            id="condition"
            className="input select"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="all">All conditions</option>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="sort">Sort by</label>
          <select
            id="sort"
            className="input select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="view-toggle">
          <button
            type="button"
            className={view === "table" ? "active" : ""}
            aria-pressed={view === "table"}
            onClick={() => changeView("table")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Tableview
          </button>
          <button
            type="button"
            className={view === "grid" ? "active" : ""}
            aria-pressed={view === "grid"}
            onClick={() => changeView("grid")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="5" width="4" height="4" rx="1" />
              <rect x="10" y="5" width="4" height="4" rx="1" />
              <rect x="17" y="5" width="4" height="4" rx="1" />
              <rect x="3" y="13" width="4" height="4" rx="1" />
              <rect x="10" y="13" width="4" height="4" rx="1" />
              <rect x="17" y="13" width="4" height="4" rx="1" />
            </svg>
            Gridview
          </button>
        </div>
        {!loading && !error && (
          <span className="list-count">
            {visible.length === count
              ? `${count} ${count === 1 ? "product" : "products"}`
              : `${visible.length} of ${count} products`}
          </span>
        )}
      </div>

      {loading && <p className="list-count">Loading…</p>}
      {error && <div className="alert">{error}</div>}

      {!loading && !error && visible.length === 0 && (
        <div className="card empty">
          {count === 0 ? (
            <>
              <p>No products yet.</p>
              <Link to="/create" className="btn btn-primary">
                + New Product
              </Link>
            </>
          ) : (
            <p>No products match your filters.</p>
          )}
        </div>
      )}

      {!loading && !error && visible.length > 0 && view === "table" && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Condition</th>
                <th>Price</th>
                <th aria-label="Actions"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p._id}>
                  <td>
                    {p.image ? (
                      <img className="thumb" src={imageUrl(p.image)} alt="" loading="lazy" />
                    ) : (
                      <span className="thumb thumb-empty">
                        <ImageIcon />
                      </span>
                    )}
                  </td>
                  <td>
                    <Link to={`/readSpecific/${p._id}`} className="row-link">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.quantity}</td>
                  <td>
                    <Condition damaged={p.isDamage} />
                  </td>
                  <td>{formatPrice(p.price)}</td>
                  <td className="cell-menu">
                    <ActionMenu
                      label={p.name}
                      onView={handleView(p._id)}
                      onEdit={handleUpdate(p._id)}
                      onDelete={handleDelete(p)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && visible.length > 0 && view === "grid" && (
        <div className="product-grid">
          {visible.map((p) => (
            <article className="product-card" key={p._id}>
              <Link to={`/readSpecific/${p._id}`} className="product-image">
                {p.image ? (
                  <img src={imageUrl(p.image)} alt={p.name} loading="lazy" />
                ) : (
                  <span className="no-image">
                    <ImageIcon size={28} />
                    No picture
                  </span>
                )}
              </Link>
              <div className="product-body">
                <div className="product-head">
                  <Link to={`/readSpecific/${p._id}`} className="product-title">
                    {p.name}
                  </Link>
                  <ActionMenu
                    label={p.name}
                    onView={handleView(p._id)}
                    onEdit={handleUpdate(p._id)}
                    onDelete={handleDelete(p)}
                  />
                </div>
                <div className="product-price">{formatPrice(p.price)}</div>
                <div className="product-meta">
                  <span>Qty: {p.quantity}</span>
                  <Condition damaged={p.isDamage} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
};

export default ReadAll;
