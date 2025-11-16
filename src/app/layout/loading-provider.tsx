"use client";
import { useEffect, useState } from "react";
import Preloader from "@/components/Preloader";

export default function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let loadHandler: (() => void) | null = null;

    const waitForWindowLoad = new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }

      if (document.readyState === "complete") {
        resolve();
        return;
      }

      loadHandler = () => {
        resolve();
      };

      window.addEventListener("load", loadHandler, { once: true });
    });

    const waitForFonts =
      typeof document !== "undefined" && "fonts" in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.ready.catch(
            () => {
              // Ignore font loading errors; we still want to proceed.
            }
          )
        : Promise.resolve();

    // Enforce a minimum duration so the preloader animation has time to fully play, even on very fast connections.
    const MIN_LOADING_TIME = 2500;
    const waitForMinimumTime = new Promise<void>((resolve) =>
      setTimeout(resolve, MIN_LOADING_TIME)
    );

    Promise.all([waitForWindowLoad, waitForFonts, waitForMinimumTime]).then(
      () => {
        if (!cancelled) {
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      if (loadHandler) {
        window.removeEventListener("load", loadHandler);
      }
    };
  }, []);

  return (
    <>
      {children}
      {loading && <Preloader />}
    </>
  );
}
