import Link from "next/link";
import { ArrowRight, X, ArrowDown } from "lucide-react";
import { useState } from "react";

export default function NotificationBanner({
  scrolled,
}: {
  scrolled: boolean;
}) {
  const [closed, setClosed] = useState(false);
  return (
    <>
      {closed && (
        <button
          onClick={() => setClosed(false)}
          className={`${scrolled ? "-translate-y-full" : "translate-y-0"} transition-transform absolute top-0 left-1/2 py-1 px-2 bg-red-700 rounded-b-lg -translate-x-1/2 z-10`}
        >
          <ArrowDown />
        </button>
      )}
      <div
        className={`${scrolled || closed ? "h-0" : "h-10"} transition-all duration-1000 overflow-hidden relative text-white bg-gradient-to-r from-red-700 via-red-600 to-red-800 whitespace-nowrap`}
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
        <X
          className="absolute right-4 top-1/2 -translate-y-1/2"
          onClick={() => setClosed(true)}
        />
      </div>
    </>
  );
}
