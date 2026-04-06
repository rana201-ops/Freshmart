import { useEffect } from "react";

export default function PageTitle({ title }) {
  useEffect(() => {
    const base = "FreshMart";
    document.title = title ? `${title} • ${base}` : base;
  }, [title]);

  return null;
}