import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function Newsletter() {
  return (
    <section className="py-16 bg-gray-800">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h3 className="mb-4 text-2xl font-bold">Stay in the Loop</h3>
          <p className="mb-6 text-gray-400">
            Get cycling tips, product updates, and exclusive offers delivered
            to your inbox.
          </p>
          <div className="flex flex-col gap-4 mx-auto max-w-md sm:flex-row">
            <Input
              type="email"
              placeholder="Enter your email"
              className="placeholder-gray-400 text-white bg-gray-700 border-gray-600"
            />
            <Button className="whitespace-nowrap bg-blue-600 hover:bg-blue-700">
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
