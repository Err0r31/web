import React, { useEffect, useState } from "react";
import { PuffLoader } from "react-spinners";
import {
  getCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from "../../utils/api";
import { useToast } from "../../components/shared/Toast/ToastProvider";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import CartItem from "../../components/Cart/CartItem/CartItem";
import CartSummary from "../../components/Cart/CartSummary/CartSummary";
import styles from "./CartPage.module.scss";

export default function CartPage() {
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const formatPrice = (price) => {
    return price ? `${Number(price).toLocaleString("ru-RU")}` : "N/A";
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await getCart();
      setCart(cartData);
    } catch (err) {
      setError(err.message || "Ошибка загрузки корзины");
      showToast("Ошибка загрузки корзины", "error");
    } finally {
      setLoading(false);
    }
  };

  const mergeCartItems = (existingItems, newItems) => {
    return newItems.map((newItem) => {
      const existingItem = existingItems.find(
        (item) =>
          (item.id || item.variation_id) ===
          (newItem.id || newItem.variation_id)
      );
      if (
        existingItem &&
        (!newItem.product?.image ||
          !newItem.product?.color_images ||
          !newItem.product?.brand ||
          !newItem.product?.discount_percentage ||
          !newItem.product?.price)
      ) {
        return {
          ...newItem,
          product: {
            ...newItem.product,
            image: existingItem.product?.image || newItem.product?.image,
            color_images:
              existingItem.product?.color_images ||
              newItem.product?.color_images ||
              [],
            brand:
              existingItem.product?.brand || newItem.product?.brand || "N/A",
            price: existingItem.product?.price || newItem.product?.price,
            total_price:
              existingItem.product?.total_price || newItem.product?.total_price,
            discount_percentage:
              existingItem.product?.discount_percentage ||
              newItem.product?.discount_percentage ||
              0,
          },
        };
      }
      return newItem;
    });
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const updatedCart = await updateCartItem(itemId, quantity);
      setCart((prevCart) => ({
        ...updateCartItem,
        items: mergeCartItems(prevCart.items, updatedCart.items),
      }));
    } catch (err) {
      showToast("Ошибка обновления количества", "error");
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const updatedCart = await deleteCartItem(itemId);
      setCart((prevCart) => ({
        ...updateCartItem,
        items: mergeCartItems(prevCart.items, updatedCart.items),
      }));
      showToast("Товар удален из корзины", "success");
    } catch (err) {
      showToast("Ошибка удаления товара", "error");
      console.error(err);
    }
  };

  const handleClearCart = async () => {
    try {
      const clearedCart = await clearCart();
      setCart(clearedCart);
      showToast("Корзина очищена", "success");
    } catch (err) {
      showToast("Ошибка очистки корзины", "error");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
      <div className={styles.cart__loading}>
        <PuffLoader color="#3E549D" size={60} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.cart__error}>{error}</div>;
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <>
        <Header />
        <div className={styles.cart__empty}>Корзина пуста</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="content" id="main-content">
        <div className="container">
          <div className={styles.cart}>
            <div className={styles.cart__header}>
              <h1 className={styles.cart__header_title}>
                Корзина ({cart.items.length})
              </h1>
              <button
                onClick={handleClearCart}
                className={styles.cart__header_clear}
                aria-label="Очистить корзину"
              >
                Удалить все
              </button>
            </div>
            <div className={styles.cart__content}>
              <div className={styles.cart__items}>
                {cart.items.map((item) => (
                  <CartItem
                    key={item.id || item.variation_id}
                    item={item}
                    formatPrice={formatPrice}
                    onUpdateQuantity={handleUpdateQuantity}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </div>
              <CartSummary cart={cart} formatPrice={formatPrice} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
