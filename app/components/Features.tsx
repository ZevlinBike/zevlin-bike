import { Bike, Shield, Leaf, Trophy } from "lucide-react"

export default function Features() {
  return (
    <section className="py-20">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Why Choose Zevlin Crack?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Trusted by professional cyclists and enthusiasts for every ride.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="text-center group">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full transition-transform duration-300 group-hover:scale-110">
              <Bike className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">All-Day Comfort</h3>
            <p className="text-gray-400">
              Our formula reduces friction and prevents saddle sores, keeping you comfortable on your longest rides.
            </p>
          </div>

          <div className="text-center group">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full transition-transform duration-300 group-hover:scale-110">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Skin Protection</h3>
            <p className="text-gray-400">
              Creates a long-lasting, protective barrier on your skin to fight friction and irritation.
            </p>
          </div>

          <div className="text-center group">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-purple-600 rounded-full transition-transform duration-300 group-hover:scale-110">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Natural Formula</h3>
            <p className="text-gray-400">
              Made with natural, non-tingle ingredients, our cream is gentle on your skin and perfect for everyday use.
            </p>
          </div>

          <div className="text-center group">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-orange-600 rounded-full transition-transform duration-300 group-hover:scale-110">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Pro-Cyclist Approved</h3>
            <p className="text-gray-400">
              Developed with and trusted by professional cyclists to perform at the highest levels.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}