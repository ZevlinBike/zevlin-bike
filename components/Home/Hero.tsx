import React from "react";
import Image from "next/image";
import Button from "../shared/Button";
import Container from "../shared/Container";

const Hero: React.FC = () => (
  <section className="flex overflow-hidden relative justify-center items-center pt-20 w-full min-h-[80dvh]">
    <Image
      className="grayscale"
      src="/images/hero-image.png"
      alt="Zevlin Bike Hero"
      fill
      style={{ objectFit: "cover", zIndex: 0 }}
      priority
    />
    <div className="absolute inset-0 z-10 bg-black/60" />
    <Container className="relative z-20 py-24 text-center text-white">
      <h1 className="mb-4 text-5xl font-extrabold tracking-tight md:text-7xl">
        Goods for Your Goods
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-lg md:text-xl text-neutral-200">
        Ride-ready gear that works as hard as you do. Designed for cyclists,
        built for the journey.
      </p>
      <Button variant="primary" size="lg">
        Shop Now
      </Button>
    </Container>
  </section>
);

export default Hero;
