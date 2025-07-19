import Image from "next/image";

export default function Logo() {
  return (
    <div className={`flex gap-2 items-center text-lg font-bold text-white`}>
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
