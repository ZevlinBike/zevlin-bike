import Logo from "@/components/Logo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-12 text-black bg-white border-t border-gray-800">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center mb-4 space-x-2">
              <Logo className="invert" />
            </div>
            <p className="text-sm text-gray-700">
              Premium cycling products designed for real riders — from chamois
              cream to bar tape and more. Built for comfort, made to last.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Products</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Chamois Cream
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Handlebar Tape
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Cycling Apparel
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Limited Drops
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  About Zevlin
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Our Mission
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 text-sm text-center text-gray-700 border-t border-gray-800">
          <p>
            &copy; {new Date().getFullYear()} Zevlin Bike. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
