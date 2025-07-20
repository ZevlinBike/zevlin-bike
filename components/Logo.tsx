import Image from "next/image";

export default function Logo({ className }: { className?: string }) {
  return (
    <div
      className={`flex gap-2 transition-all items-center text-lg font-bold text-white ${className}`}
    >
      <Image
        className="grayscale brightness-0 invert"
        src="/images/logo.png"
        alt="Zevlin Bike Logo"
        width={32}
        height={32}
      />
      Zevlin Bike
    </div>
  );
}
