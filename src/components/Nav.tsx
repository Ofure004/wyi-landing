"use client";

import Image from "next/image";
import { useState } from "react";
import logo from "../../public/images/logo.svg";

export function Nav() {
  const [activeId, setActiveId] = useState<string>("home");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-30 font-charleville">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative h-16 md:h-20 flex items-center justify-between rounded-b-2xl bg-black/20 backdrop-blur-sm border-b border-white/10">
          <a
            href="#home"
            className="flex items-center gap-2 px-2 md:px-3 w-14 h-14 md:w-18 md:h-18"
          >
            <Image
              src={logo}
              alt="watts your impact logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          </a>
          {/* Desktop / tablet nav */}
          <div className="hidden sm:flex items-center gap-4 md:gap-8 lg:gap-12 px-2 text-xl md:text-2xl lg:text-3xl text-white w-full justify-center">
            {[
              { id: "home", label: "Home" },
              { id: "episodes", label: "Episodes" },
              { id: "contact", label: "Contact" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={`nav-link ${activeId === item.id ? "active" : ""}`}
                data-replace={item.label}
                aria-current={activeId === item.id ? "page" : undefined}
              >
                <span>{item.label}</span>
              </a>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex sm:hidden items-center justify-center w-10 h-10 rounded-full text-white mr-1"
            aria-label="Toggle navigation menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="sr-only">Toggle menu</span>
            <span className="relative flex flex-col gap-1.5">
              <span
                className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${
                  isOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-white transition-opacity duration-200 ${
                  isOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-5 bg-white transition-transform duration-200 ${
                  isOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </span>
          </button>

          {/* Mobile dropdown menu */}
          {isOpen && (
            <div className="absolute inset-x-2 top-full mt-2 rounded-2xl bg-black/90 border border-white/15 shadow-lg sm:hidden">
              <nav className="flex flex-col py-2 px-3 text-base text-white">
                {[
                  { id: "home", label: "Home" },
                  { id: "episodes", label: "Episodes" },
                  { id: "contact", label: "Contact" },
                ].map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={() => {
                      setActiveId(item.id);
                      setIsOpen(false);
                    }}
                    className={`py-2 px-2 rounded-lg ${
                      activeId === item.id
                        ? "bg-white/10 text-[var(--brand-yellow)]"
                        : "hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
