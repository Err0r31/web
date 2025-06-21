import React, { useState, useEffect } from "react";
import { useToast } from "../../components/shared/Toast/ToastProvider";
import { getCart } from "../../utils/api";
import Header from "../../components/Header/Header"
import Footer from "../../components/Footer/Footer";
import CheckoutForm from "../../components/Checkout/CheckoutForm/CheckoutForm";
import CheckoutSummary from "../../components/Checkout/CheckoutSummary/CheckoutSummary";
import styles from "./CheckoutPage.module.scss";

export default function CheckoutPage() {
  const { showToast } = useToast();
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchCart();
  }, [showToast]);

  if (loading) {
    return (
      <div className={styles.checkout__loading}>Загрузка...</div>
    );
  }

  if (error) {
    return <div className={styles.checkout__error}>{error}</div>;
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <>
        <Header />
        <div className={styles.checkout__empty}>Корзина пуста</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="content" id="main-content">
        <div className="container">
          <div className={styles.checkout}>
            <CheckoutForm />
            <CheckoutSummary cart={cart} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}