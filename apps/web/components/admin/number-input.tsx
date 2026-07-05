"use client";

import { useState } from "react";

interface NumberInputProps {
  name: string;
  defaultValue?: number | "";
  placeholder?: string;
  required?: boolean;
}

function formatThousands(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Input de enteros (precios, stock) que muestra separador de miles mientras se escribe. */
export function NumberInput({ name, defaultValue = "", placeholder, required }: NumberInputProps) {
  const [digits, setDigits] = useState(defaultValue === "" ? "" : String(defaultValue));

  return (
    <>
      <input type="hidden" name={name} value={digits} />
      <input
        type="text"
        inputMode="numeric"
        required={required}
        placeholder={placeholder}
        className="input"
        value={formatThousands(digits)}
        onChange={(e) => setDigits(e.target.value.replace(/\D/g, ""))}
      />
    </>
  );
}
