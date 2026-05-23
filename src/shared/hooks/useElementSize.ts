"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

type Size = {
  width: number;
  height: number;
};

const INITIAL_SIZE: Size = {
  width: 0,
  height: 0,
};

export function useElementSize<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [size, setSize] = useState<Size>(INITIAL_SIZE);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const updateSize = () => {
      setSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
