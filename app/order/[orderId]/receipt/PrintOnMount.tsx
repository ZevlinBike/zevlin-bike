"use client";

import { useEffect } from "react";

export default function PrintOnMount() {
  useEffect(() => {
    // Delay slightly to allow fonts/styles to settle
    const id = setTimeout(() => {
      try {
        window.print();
      } catch {}
    }, 200);
    return () => clearTimeout(id);
  }, []);
  return null;
}

