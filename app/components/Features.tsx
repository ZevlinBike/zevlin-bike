import { Bike, Shield, Leaf, Trophy } from "lucide-react";

const features = [
  {
    title: "All-Day Comfort",
    description:
      "Our formula reduces friction and prevents saddle sores, keeping you comfortable on your longest rides.",
    icon: Bike,
    bgColor: "bg-blue-600",
  },
  {
    title: "Skin Protection",
    description:
      "Creates a long-lasting, protective barrier on your skin to fight friction and irritation.",
    icon: Shield,
    bgColor: "bg-green-600",
  },
  {
    title: "Natural Formula",
    description:
      "Made with natural, non-tingle ingredients, our cream is gentle on your skin and perfect for everyday use.",
    icon: Leaf,
    bgColor: "bg-purple-600",
  },
  {
    title: "Pro-Cyclist Approved",
    description:
      "Developed with and trusted by professional cyclists to perform at the highest levels.",
    icon: Trophy,
    bgColor: "bg-orange-600",
  },
];

export default function Features() {
  return (
    <section className="py-20">
      <div className="container px-4 mx-auto lg:px-6">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-black md:text-4xl">
            Why Choose Zevlin Crack?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Trusted by professional cyclists and enthusiasts for every ride.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ title, description, icon: Icon, bgColor }, i) => (
            <div key={i} className="text-center group">
              <div
                className={`flex justify-center items-center mx-auto mb-4 w-16 h-16 rounded-full transition-transform duration-300 group-hover:scale-110 ${bgColor}`}
              >
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-black">{title}</h3>
              <p className="text-gray-700">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
