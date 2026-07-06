"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export default function CrispChat() {
  useEffect(() => {
    Crisp.configure("3a8e71e5-d3d3-4b6c-96c1-b4ca14e1e08f");
  }, []);

  return null;
}
