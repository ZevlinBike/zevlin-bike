import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotificationBanner({
  scrolled,
}: {
  scrolled: boolean;
}) {
  return (
    <div
      className={`${scrolled ? "h-0" : "h-10"} transition-all duration-1000 overflow-hidden relative text-white bg-gradient-to-r from-green-500 via-pink-500 to-blue-500`}
    >
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex justify-center items-center p-2">
          <p className="text-sm font-medium">
            <span className="mr-4 font-black uppercase">Big News!</span>{" "}
            We&apos;re launching a new product line soon.
          </p>
          <Link
            href="/new-products"
            className="flex items-center ml-4 text-sm font-semibold hover:underline"
          >
            Learn More
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
