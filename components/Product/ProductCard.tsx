import Image from "next/image";
import React from "react";
import Button from "../shared/Button";

interface ProductCardProps {
  name: string;
  price: number;
  image: string;
  description: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ name, price, image, description }) => {
  return (
    <div className="border rounded-lg p-4 md:grid md:grid-cols-2 md:gap-8 items-center">
      <Image src={image} alt={name} width={600} height={600} className="rounded-lg" />
      <div>
        <h3 className="text-2xl font-bold mt-4 md:mt-0">{name}</h3>
        <p className="text-lg my-2">${price}</p>
        <p className="my-4">{description}</p>
        <Button>Add to Cart</Button>
      </div>
    </div>
  );
};

export default ProductCard;
