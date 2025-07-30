"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product } from "@/store/cartStore";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Fragment, useRef, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";


const ProductCard = ({ product }: { product: Product }) => {
    const addToCart = useCartStore((state) => state.addToCart);
    const [added, setAdded] = useState(false);
    const controls = useAnimation();
    const [showModal, setShowModal] = useState(false);
  
    // Handler for Add to Cart
    const handleAddToCart = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent card click
      setAdded(true);
      addToCart(product);
      controls.start({ scale: [1, 1.2, 0.95, 1], backgroundColor: ["#2563eb", "#22c55e", "#2563eb"] });
      setTimeout(() => setAdded(false), 1000);
    };
  
    // Handler for card click (open modal)
    const handleCardClick = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
  
    return (
      <Fragment>
        <Card
          className="overflow-hidden relative bg-white rounded-xl border border-gray-200 shadow-md transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 hover:shadow-xl group cursor-pointer p-0"
          onClick={handleCardClick}
        >
          <CardContent className="flex flex-col p-4 h-full">
            <div className="flex overflow-hidden relative justify-center items-center mb-3 w-full bg-gray-50 rounded-lg transition-transform duration-300 dark:bg-gray-700 aspect-square group-hover:scale-[1.03]">
              <Image
                alt={product.name}
                src={product.image}
                fill
                className="object-contain p-2"
              />
            </div>
            <Badge className="mb-2 text-xs text-red-700 border dark:text-red-300 bg-red-700/10 border-red-700/20 dark:bg-red-700/20 dark:border-red-700/30">
              {product.categories[0] || "Cycling Product"}
            </Badge>
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white truncate">
              {product.name}
            </h3>
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 truncate" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>
            <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-100 dark:border-gray-700">
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${product.price.toFixed(2)}
              </span>
              <motion.button
                className={`text-white px-3 py-1.5 rounded transition-colors duration-300 font-semibold focus:outline-none text-sm ${added ? "bg-green-500" : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"}`}
                onClick={handleAddToCart}
                animate={controls}
                whileTap={{ scale: 0.9 }}
                style={{ outline: "none", border: "none" }}
              >
                {added ? "Added!" : "Add to Cart"}
              </motion.button>
            </div>
          </CardContent>
        </Card>
        <AnimatePresence>
          {showModal && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
            >
              <motion.div
                className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6 relative z-10"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl font-bold"
                  onClick={handleCloseModal}
                  aria-label="Close"
                >
                  ×
                </button>
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 mb-4">
                    <Image
                      alt={product.name}
                      src={product.image}
                      fill
                      className="object-contain rounded-lg bg-gray-100 dark:bg-gray-800"
                    />
                  </div>
                  <Badge className="mb-2 text-xs text-red-700 border dark:text-red-300 bg-red-700/10 border-red-700/20 dark:bg-red-700/20 dark:border-red-700/30">
                    {product.categories[0] || "Cycling Product"}
                  </Badge>
                  <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white text-center">
                    {product.name}
                  </h2>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                    {product.description}
                  </p>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    ${product.price.toFixed(2)}
                  </span>
                  <motion.button
                    className={`text-white px-4 py-2 rounded transition-colors duration-300 font-semibold focus:outline-none text-base ${added ? "bg-green-500" : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"}`}
                    onClick={handleAddToCart}
                    animate={controls}
                    whileTap={{ scale: 0.9 }}
                    style={{ outline: "none", border: "none" }}
                  >
                    {added ? "Added!" : "Add to Cart"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Fragment>
    );
  };

  export default ProductCard;