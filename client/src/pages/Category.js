import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";


const CATEGORY_IMAGES = {
  "fresh-fruits":
    "https://tse1.mm.bing.net/th/id/OIP.22XOhxYrd_Pu__NkrGadMgHaEo?rs=1&pid=ImgDetMain&o=7&rm=3",
  "green-vegetables":
    "https://bettervitamin.com/wp-content/uploads/2013/07/vegetables.jpg",
  "organic-dairy":
    "https://tse4.mm.bing.net/th/id/OIP.GNYQIQe-sLEd7dWIO2MLsAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
  "healthy-staples":
    "https://img.freepik.com/premium-photo/set-groats-grains-buckwheat-lentils-rice-millet-barley-corn-black-rice-blue-wooden-background-top-view-copy-space_187166-29262.jpg",
    "bakery":
    "https://images.unsplash.com/photo-1509440159596-0249088772ff",
};

const ALL_CATEGORIES = [
  "fresh-fruits",
  "green-vegetables",
  "organic-dairy",
  "healthy-staples",
  "bakery"
];

const Category = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);

  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ UI only: simple hover state for cards
  const [hoverSub, setHoverSub] = useState(null);

  useEffect(() => {
  const load = async () => {
    try {
      setLoading(true);

      // 1️⃣ Load category
      const res = await api.get("/api/categories");
      const found = (res.data || []).find((c) => c.slug === name);
      setCat(found || null);

      // 2️⃣ Load subcategories separately
      if (found) {
        const subRes = await api.get(
          `/api/subCategories?categorySlug=${name}`
        );
        setSubs(subRes.data || []);
      } else {
        setSubs([]);
      }

    } catch (e) {
      setCat(null);
      setSubs([]);
    } finally {
      setLoading(false);
    }
  };

  load();
}, [name]);
useEffect(()=>{
  window.scrollTo(0,0);
},[name]);

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (!cat) return <h3 className="text-center mt-5">Category not found</h3>;

  const bannerImg = CATEGORY_IMAGES[name] || CATEGORY_IMAGES["fresh-fruits"];

  const currentIndex = ALL_CATEGORIES.indexOf(name);
  const prevCategory = currentIndex > 0 ? ALL_CATEGORIES[currentIndex - 1] : null;
  const nextCategory =
    currentIndex >= 0 && currentIndex < ALL_CATEGORIES.length - 1
      ? ALL_CATEGORIES[currentIndex + 1]
      : null;

  // ✅ Styles (inline only; logic unchanged)
  const navBtnStyle = {
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
  };

 
  const bannerWrapStyle = {
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0 18px 45px rgba(0,0,0,0.12)",
    marginBottom: 22,
  };

  const bannerImgStyle = {
    height: "clamp(180px, 30vw, 280px)",
    width: "100%",
    objectFit: "cover",
    display: "block",
    transform: "scale(1.02)",
  };

  const bannerOverlayStyle = {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.20) 100%)",
    pointerEvents: "none",
  };

  const cardBaseStyle = {
    borderRadius: 18,
    border: "1px solid rgba(0,0,0,0.06)",
    background: "#fff",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
  };

  const cardHoverStyle = {
    transform: "translateY(-6px)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
    borderColor: "rgba(25,135,84,0.25)",
  };

  const viewStyle = (isHover) => ({
    color: "#198754",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "transform 0.2s ease",
    transform: isHover ? "translateX(3px)" : "translateX(0px)",
  });

  return (
    <div className="container py-4">
      {/* ✅ CATEGORY NAV (Arrows) */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        {prevCategory ? (
          <button
            className="btn"
            style={navBtnStyle}
            onClick={() => navigate(`/category/${prevCategory}`)}
            title="Previous category"
          >
            ←
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}

        
        {nextCategory ? (
          <button
            className="btn"
            style={navBtnStyle}
            onClick={() => navigate(`/category/${nextCategory}`)}
            title="Next category"
          >
            →
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>

      {/* ✅ Banner Image (premium) */}
      <div style={bannerWrapStyle}>
        <img src={bannerImg} alt={cat.name} style={bannerImgStyle} />
        <div style={bannerOverlayStyle} />
      </div>

      {/* ✅ Stronger heading */}
      <div className="d-flex align-items-end justify-content-between mb-3">
        <h2 style={{ fontWeight: 950, letterSpacing: 0.3, margin: 0 }}>{cat.name}</h2>
      </div>

     <div className="row g-3">
  {subs.map((sub) => {
    const isHover = hoverSub === sub._id;

    return (
      <div className="col-6 col-md-3" key={sub._id}>
        <Link
          to={`/category/${name}/${sub.slug}`}
          className="text-decoration-none text-dark"
          style={{
            display: "block",
            ...(cardBaseStyle),
            ...(isHover ? cardHoverStyle : {}),
          }}
          onMouseEnter={() => setHoverSub(sub._id)}
          onMouseLeave={() => setHoverSub(null)}
        >
          <div className="card-body py-4 text-center">
            <h6 className="fw-semibold mb-1">{sub.name}</h6>
            <small style={viewStyle(isHover)}>
              View products →
            </small>
          </div>
        </Link>
      </div>
    );
  })}
</div>

{subs.length === 0 && (
  <p className="text-muted mt-3">No sub-categories found.</p>
)}
    </div>
  );
};

export default Category;