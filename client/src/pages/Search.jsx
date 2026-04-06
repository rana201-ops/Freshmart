import { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { ShopContext } from "../context/ShopContext";

const useQuery = () => new URLSearchParams(useLocation().search);

const Search = () => {
  const qs = useQuery();
  const navigate = useNavigate();
  const { addToCart, addToWishlist } = useContext(ShopContext);

  const q = (qs.get("q") || "").trim();

  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  const BACKEND = "http://localhost:5000";
  const getImg = (img) => {
    if (!img) return "";
    if (img.startsWith("http")) return img;
    if (img.startsWith("/uploads")) return BACKEND + img;
    const fileName = String(img).split("\\").pop().split("/").pop();
    return `${BACKEND}/uploads/${fileName}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setMsg("");
        if (!q) {
          setProducts([]);
          return;
        }
        const res = await api.get("/api/products", { params: { q } });
        setProducts(res.data || []);
      } catch (e) {
        setProducts([]);
        setMsg("Search failed");
      }
    };
    load();
  }, [q]);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-0">Search Results</h4>
          <small className="text-muted">
            Query: <b>{q || "-"}</b> • {products.length} items
          </small>
        </div>

        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      {msg && <div className="alert alert-warning">{msg}</div>}

      {!q ? (
        <div className="alert alert-info">Type something in search box.</div>
      ) : products.length === 0 ? (
        <div className="alert alert-info">No products found.</div>
      ) : (
        <div className="row g-4">
          {products.map((p) => (
            <div className="col-6 col-md-3" key={p._id}>
              <div className="card h-100 shadow-sm">
                <img
                  src={getImg(p.image)}
                  alt={p.name}
                  className="card-img-top"
                  style={{ height: 140, objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x160?text=No+Image";
                  }}
                />

                <div className="card-body">
                  <div className="fw-semibold">{p.name}</div>

                  {p.vendorShopName && (
                    <small className="text-muted d-block">
                      Sold by: <b>{p.vendorShopName}</b>
                    </small>
                  )}

                  <div className="fw-bold text-success mt-1">₹{p.price}</div>

                  <div className="d-grid gap-2 mt-2">
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => addToWishlist(p)}
                    >
                      ❤️ Wishlist
                    </button>

                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => addToCart(p)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
