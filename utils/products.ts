import { Product } from "../store/cartStore";

export const products: Product[] = [
  {
    id: "1",
    name: "Crack Chamois Cream",
    price: 23.99,
    image: "/images/zevlin-crack-00.webp",
    description:
      "Crack is our natural, non-tingle chamois cream formula designed for cooler riding days or riders who prefer smooth comfort without the tingle.",
    featured: true,
    qtyInStock: 999,
    categories: ["Cream"],
  },
  {
    id: "2",
    name: "Super Crack Chamois Cream",
    price: 23.99,
    image: "/images/zevlin-super-crack-01.webp",
    description:
      "Super Crack adds a minty kick with peppermint oil and witch hazel—ideal for hot rides when you want a little tingle and lasting freshness.",
    featured: true,
    qtyInStock: 999,
    categories: ["Cream"],
  },
  {
    id: "3",
    name: "BYOT Fitness Wash",
    price: 14.99,
    image: "/images/zevlin-BYOT-00.webp", // <-- update if image exists
    description:
      "No shower? No problem. Spray yourself down post-ride to clean up with just a towel. BYOT is your on-the-go refresh solution.",
    featured: true,
    qtyInStock: 299,
    categories: ["Aftercare"],
  },
  {
    id: "4",
    name: "BYOT Towel",
    price: 2.99,
    image: "/images/zevlin-towel-00.webp", // <-- update if image exists
    description:
      "Bring Your Own Towel. Compact, absorbent, and ready to get you cleaned up after a ride when a shower's out of reach.",
    featured: false,
    qtyInStock: 7,
    categories: ["Accessory"],
  },
  {
    id: "5",
    name: "Zevlin Gaiter",
    price: 9.99,
    image: "/images/zevlin-gaiter-00.webp", // <-- update if image exists
    description:
      "Multi-use microfiber gaiter: neck warmer, face shield, headband—or show off your Zevlin style however you wear it.",
    featured: false,
    qtyInStock: 8,
    categories: ["Accessory"],
  },
];
