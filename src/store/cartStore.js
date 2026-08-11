import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,
      isCheckoutOpen: false,
      checkoutStep: 'FORM',
      customerForm: {
        name: '',
        email: '',
        phone: '',
        address: '',
        city: 'Lagos',
        paymentMethod: 'PAY_ON_DELIVERY',
      },

      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setIsCheckoutOpen: (isOpen) => set({ isCheckoutOpen: isOpen }),
      setCheckoutStep: (step) => set({ checkoutStep: step }),
      setCustomerForm: (form) => set({ customerForm: form }),

      addToCart: (product, size = 'L', color = null) => {
        const chosenColor = color || (product.colors && product.colors[0]?.name) || 'Standard';
        
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (item) => item.id === product.id && item.size === size && item.color === chosenColor
          );

          if (existingIndex > -1) {
            const updated = [...state.cart];
            updated[existingIndex].quantity += 1;
            return { cart: updated, isCartOpen: true };
          }

          return {
            cart: [
              ...state.cart,
              {
                id: product.id,
                title: product.title,
                price: product.price,
                size,
                color: chosenColor,
                image: product.image,
                quantity: 1,
              },
            ],
            isCartOpen: true,
          };
        });
      },

      updateCartQty: (index, delta) => {
        set((state) => {
          const updated = [...state.cart];
          updated[index].quantity += delta;
          if (updated[index].quantity <= 0) {
            updated.splice(index, 1);
          }
          return { cart: updated };
        });
      },

      clearCart: () => set({ cart: [] }),

      cartSubtotal: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      
      cartItemCount: () => {
        const { cart } = get();
        return cart.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    {
      name: 'klasik-cart-storage',
    }
  )
);
