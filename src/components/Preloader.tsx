"use client";
import Lottie from "lottie-react";
import animationData from "../../public/animations/preloader.json";

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <Lottie
        animationData={animationData}
        loop={true}
        className="w-full h-full"
      />
    </div>
  );
}
