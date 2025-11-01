"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { Fragment, useState } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Product } from "@/lib/schema";

const ProductCard = ({ product, isFocused }: { product: Product, isFocused: boolean }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const [added, setAdded] = useState(false);
  const controls = useAnimation();
  const [showModal, setShowModal] = useState(isFocused);

  const featuredImage = product.product_images?.find(img => img.is_featured)?.url || product.product_images?.[0]?.url || "/images/placeholder.png";

  const isOutOfStock = !product.quantity_in_stock || product.quantity_in_stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isOutOfStock) return;
    e.stopPropagation();
    setAdded(true);
    addToCart(product);
    controls.start({ scale: [1, 1.2, 0.95, 1], backgroundColor: ["#2563eb", "#22c55e", "#2563eb"] });
    setTimeout(() => setAdded(false), 1000);
  };

  const handleCardClick = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <Fragment>
      <Card
        className="overflow-hidden relative bg-white rounded-xl border border-gray-200 shadow-md transition-all duration-300 dark:bg-black dark:border-gray-700 hover:border-blue-500 hover:shadow-xl group cursor-pointer p-0"
        onClick={handleCardClick}
      >
        <CardContent className="flex flex-col p-4 h-full">
          <div className="flex overflow-hidden relative justify-center items-center mb-3 w-full rounded-lg aspect-square ">
            <Image
              alt={product.name}
              src={featuredImage}
              fill
              className="object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300 "
            />
          </div>
          {/* Placeholder for category */}
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white truncate">
            {product.name}
          </h3>
          {product.quantity_in_stock && product.quantity_in_stock > 0 ? (
            <Badge className="mb-2 text-xs dark:text-green-200 text-green-800 border bg-green-300/40 border-green-500/20 dark:bg-green-500/40 dark:border-green-500/30 w-fit">
              In Stock
            </Badge>
          ) : (
            <Badge className="mb-2 text-xs text-gray-500 border bg-neutral-500/10 border-gray-500/20 dark:bg-neutral-500/20 dark:border-gray-500/30 w-fit">
              Out of Stock
            </Badge>
          )}
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 truncate" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
          <div className="flex justify-between items-center pt-2 mt-auto border-t border-gray-100 dark:border-gray-700">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              ${(product.price_cents / 100).toFixed(2)}
            </span>
            <motion.button
              className={`text-white px-3 py-1.5 rounded transition-colors duration-300 font-semibold focus:outline-none text-sm ${
                added
                  ? "bg-green-500"
                  : isOutOfStock
                  ? "bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed"
                  : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
              }`}
              onClick={handleAddToCart}
              animate={controls}
              whileTap={{ scale: 0.9 }}
              style={{ outline: "none", border: "none" }}
              disabled={isOutOfStock}
            >
              {added ? "Added!" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
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
              className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-md w-full p-6 relative z-10"
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
                    src={featuredImage}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white text-center">
                  {product.name}
                </h2>
                {product.quantity_in_stock && product.quantity_in_stock > 0 ? (
                  <Badge className="mb-2 text-xs text-green-700 border bg-green-700/10 border-green-700/20 dark:bg-green-700/20 dark:border-green-700/30 w-fit">
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="mb-2 text-xs text-gray-500 border bg-neutral-500/10 border-gray-500/20 dark:bg-neutral-500/20 dark:border-gray-500/30 w-fit">
                    Out of Stock
                  </Badge>
                )}
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300 text-center">
                  {product.description}
                </p>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                  ${(product.price_cents / 100).toFixed(2)}
                </span>
                <motion.button
                  className={`text-white px-4 py-2 rounded transition-colors duration-300 font-semibold focus:outline-none text-base ${
                    added
                      ? "bg-green-500"
                      : isOutOfStock
                      ? "bg-neutral-400 dark:bg-neutral-600 cursor-not-allowed"
                      : "bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600"
                  }`}
                  onClick={handleAddToCart}
                  animate={controls}
                  whileTap={{ scale: 0.9 }}
                  style={{ outline: "none", border: "none" }}
                  disabled={isOutOfStock}
                >
                  {added ? "Added!" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
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
