"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Lên đầu trang"
      className={`fixed right-5 bottom-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/40 transition hover:-translate-y-0.5 ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <Icon name="arrowUp" />
    </button>
  );
}
