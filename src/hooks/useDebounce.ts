import { useState, useEffect } from "react";

export function useDebounce<T>(value: T): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [value]);

  return debouncedValue;
}
