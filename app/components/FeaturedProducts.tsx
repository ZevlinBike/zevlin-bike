import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FeaturedProducts() {
  return (
    <section id="products" className="py-20 bg-gray-800/50">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Ride Essentials, Perfected
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Engineered for cyclists who demand performance and style without
            compromise.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Product 1 */}
          <Card className="bg-gray-800 border-gray-700 transition-all duration-300 group hover:border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex justify-center items-center mb-6 w-full h-48 bg-white rounded-lg transition-transform duration-300 group-hover:scale-105">
                <div className="text-sm font-medium text-gray-400">
                  Product Image
                </div>
              </div>
              <Badge className="mb-3 text-green-400 bg-green-500/10 border-green-500/20">
                Performance
              </Badge>
              <h3 className="mb-2 text-xl font-semibold">
                Zevlin "Crack" Chamois Cream
              </h3>
              <p className="mb-4 text-gray-400">
                Say goodbye to saddle sores. Our legendary chamois cream
                provides all-day comfort so you can focus on the ride.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-400">$22.99</span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product 2 */}
          <Card className="bg-gray-800 border-gray-700 transition-all duration-300 group hover:border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex justify-center items-center mb-6 w-full h-48 bg-white rounded-lg transition-transform duration-300 group-hover:scale-105">
                <div className="text-sm font-medium text-gray-400">
                  Product Image
                </div>
              </div>
              <Badge className="mb-3 text-orange-400 bg-orange-500/10 border-orange-500/20">
                Control
              </Badge>
              <h3 className="mb-2 text-xl font-semibold">
                Zevlin "Sticky" Bar Tape
              </h3>
              <p className="mb-4 text-gray-400">
                The ultimate grip for confident handling in any condition.
                Tacky, durable, and stylish—everything your handlebars need.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-400">$39.99</span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product 3 */}
          <Card className="bg-gray-800 border-gray-700 transition-all duration-300 group hover:border-blue-500/50">
            <CardContent className="p-6">
              <div className="flex justify-center items-center mb-6 w-full h-48 bg-white rounded-lg transition-transform duration-300 group-hover:scale-105">
                <div className="text-sm font-medium text-gray-400">
                  Product Image
                </div>
              </div>
              <Badge className="mb-3 text-purple-400 bg-purple-500/10 border-purple-500/20">
                Style
              </Badge>
              <h3 className="mb-2 text-xl font-semibold">
                Zevlin "Aero" Cycling Cap
              </h3>
              <p className="mb-4 text-gray-400">
                Look fast, feel fast. This lightweight, breathable cap fits
                perfectly under your helmet and keeps you cool.
              </p>
              <div className="flex justify-between items-center">
                <span className="text-2xl font-bold text-blue-400">$29.99</span>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Add to Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
