import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Newsletter() {
  return (
    <section className="py-16 text-black bg-gray-100">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-2xl font-bold">Stay in the Loop</h3>
          <p className="mb-6 text-gray-700">
            Get cycling tips, product updates, and exclusive offers delivered to
            your inbox.
          </p>
          <div className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row">
            <Input
              type="email"
              placeholder="Enter your email"
              className="placeholder-gray-700 text-white bg-gray-200 border-gray-600"
            />
            <Button className="text-white whitespace-nowrap bg-blue-600 hover:bg-blue-700">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
