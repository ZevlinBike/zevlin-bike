import Image from "next/image";

export default function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={`flex gap-2 transition-all items-center text-lg font-bold ${className}`}>
      <Image
        src="/images/logo.webp"
        alt="Zevlin Bike Logo"
        width={32}
        height={32}
      />
      {showText && 'Zevlin Bike'}
    </span>
  );
}
