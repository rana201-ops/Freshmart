import { createContext, useEffect, useMemo, useState, useContext } from "react";
import { AuthContext } from "./AuthContext"; // ✅ path check

export const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const userId = user?._id || user?.id || user?.email || null;

  // ✅ keys always string (never null)
  const cartKey = useMemo(
    () => (userId ? `fm_cart_${userId}` : "fm_cart_guest"),
    [userId]
  );

  const wishKey = useMemo(
    () => (userId ? `fm_wish_${userId}` : "fm_wish_guest"),
    [userId]
  );

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // ✅ unique key per product + selected quantity
  const makeKey = (p) => {
    const id = p._id || p.id;
    const label = p.chosenQtyLabel || p.qtyLabel || `${p.qty} ${p.unit}`;
    return `${id}-${label}`;
  };

  // ✅ 1) User change -> restore from localStorage
  useEffect(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const savedWish = JSON.parse(localStorage.getItem(wishKey) || "[]");

      setCart(Array.isArray(savedCart) ? savedCart : []);
      setWishlist(Array.isArray(savedWish) ? savedWish : []);
    } catch {
      setCart([]);
      setWishlist([]);
    }
  }, [cartKey, wishKey]);

  // ✅ 2) Save cart (only when logged in OR guest mode allowed)
  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  useEffect(() => {
    localStorage.setItem(wishKey, JSON.stringify(wishlist));
  }, [wishlist, wishKey]);

  // ✅ ADD TO CART
  const addToCart = (product) => {
    const key = makeKey(product);

    setCart((prev) => {
      const existing = prev.find((item) => item.key === key);

      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, cartQty: (item.cartQty ?? 1) + 1 }
            : item
        );
      }

      return [...prev, { ...product, key, cartQty: 1 }];
    });
  };

  // ✅ UPDATE PACKS COUNT
  const updateQty = (key, type) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;

        const current = item.cartQty ?? 1;
        return {
          ...item,
          cartQty: type === "inc" ? current + 1 : Math.max(1, current - 1),
        };
      })
    );
  };

  // ✅ REMOVE
  const removeFromCart = (key) => {
    setCart((prev) => prev.filter((item) => item.key !== key));
  };

  const clearCart = () => setCart([]);

  // ✅ WISHLIST
  const addToWishlist = (product) => {
    const key = makeKey(product);

    setWishlist((prev) => {
      if (prev.find((item) => item.key === key)) return prev;
      return [...prev, { ...product, key }];
    });
  };

  const removeFromWishlist = (key) => {
    setWishlist((prev) => prev.filter((item) => item.key !== key));
  };

  // ✅ CART TOTAL
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = Number(item.finalPrice ?? item.price ?? 0);
      const packs = Number(item.cartQty ?? 1);
      return total + price * packs;
    }, 0);
  }, [cart]);

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        updateQty,
        removeFromCart,
        cartTotal,
        clearCart,
        addToWishlist,
        removeFromWishlist,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};