import Image from "next/image";
import Link from "next/link";

export default function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex gap-2 transition-all items-center text-lg font-bold ${className}`}
    >
      <Image
        className=""
        src="/images/logo.png"
        alt="Zevlin Bike Logo"
        width={32}
        height={32}
      />
      Zevlin Bike
    </Link>
  );
}
