import { useContext } from "react";
import { CartContext } from "@/context/cartContext";

export function useCart() {
  const v = useContext(CartContext);
  if (!v) throw new Error("useCart doit être utilisé dans CartProvider");
  return v;
}
