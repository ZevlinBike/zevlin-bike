import Image from "next/image";

export default function HeroBackground() {
  return (
    <>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-white dark:from-gray-900 dark:via-gray-800 dark:to-black" />
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-white to-transparent dark:from-black to-transparent" />
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-white via-transparent to-transparent dark:from-black to-transparent" />

      <DotGrid />
      {/* Faint hero background image */}
      <Image
        className="object-cover absolute inset-0 z-0 w-full h-full opacity-40 brightness-150 grayscale"
        src="/images/hero-image.png"
        alt="Zevlin Hero"
        fill
        priority
      />
    </>
  );
}

function DotGrid() {
  return (
    <div className="absolute inset-0 right-1/2 z-10 opacity-100">
      <div
        className="absolute inset-0 dark:invert"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,.5) 1px, transparent 0)`,
          backgroundSize: "50px 50px",
          WebkitMaskImage:
            "linear-gradient(to right, black 40%, transparent 100%)",
          maskImage: "linear-gradient(to right, black 40%, transparent 100%)",
        }}
      />
    </div>
  );
}
