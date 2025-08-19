import { create } from "zustand";

type Item = { id: number; name: string; price: number; qty: number };
type CartState = {
  items: Item[];
  add: (item: Item) => void;
  remove: (id: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item) => {
    const found = get().items.find((i) => i.id === item.id);
    if (found) {
      set({
        items: get().items.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + item.qty } : i
        ),
      });
    } else {
      set({ items: [...get().items, item] });
    }
  },
  remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
}));
