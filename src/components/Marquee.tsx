import Image from "next/image";

export default function Marquee() {
  const base = [
    "/images/wyilogos/wyiblue.png",
    "/images/wyilogos/wyibrown.png",
    "/images/wyilogos/wyigreen.png",
    "/images/wyilogos/wyiorange.png",
    "/images/wyilogos/wyipurple.png",
    "/images/wyilogos/wyiyellow.png",
  ];

  // Duplicate the array once (not 3x)
  const items = [...base, ...base];

  return (
    <div className="marquee py-8">
      <div className="marquee-track">
        {items.map((src, idx) => (
          <div key={idx} className="marquee-item">
            <Image
              src={src}
              alt={`WYI logo ${idx}`}
              width={120}
              height={100}
              className="object-contain"
              priority={idx < 6}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
