"use client";
import Lottie from "lottie-react";
import animationData from "../../public/animations/preloader.json";

export default function Preloader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* 
        If your Lottie file has a small watermark near the edge,
        we can zoom in slightly and hide the edges with overflow-hidden.
        Adjust the scale value as needed to fully crop out the watermark.
      */}
      <div className="w-full h-full overflow-hidden">
        <Lottie
          animationData={animationData}
          loop={true}
          className="w-full h-full scale-[1.15]"
        />
      </div>
    </div>
  );
}
