"use client";

import { useEffect, useState } from "react";
import { SvgChevronUp } from "../../public/assets/svgs";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-40 rounded-full bg-[var(--brand-pink)] text-white shadow-lg w-10 h-10 md:w-12 md:h-12 flex items-center justify-center hover:bg-[var(--brand-yellow)] hover:text-black transition-colors duration-200 cursor-pointer"
    >
      <SvgChevronUp />
    </button>
  );
}
