import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotificationBanner({
  scrolled,
}: {
  scrolled: boolean;
}) {
  return (
    <div
      className={`${scrolled ? "h-0" : "h-10"} transition-all duration-1000 overflow-hidden relative text-black bg-gradient-to-r from-yellow-400 to-orange-500 whitespace-nowrap`}
    >
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex justify-center items-center p-2">
          <p className="text-sm font-medium">
            <span className="hidden mr-3 font-black uppercase sm:inline-block">
              Big News!
            </span>{" "}
            New Products Coming Soon
          </p>
          <Link
            href="/new-products"
            className="flex items-center ml-3 text-sm font-semibold hover:underline"
          >
            Learn More
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
