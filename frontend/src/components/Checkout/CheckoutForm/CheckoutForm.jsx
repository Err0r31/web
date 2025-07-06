import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../shared/Toast/ToastProvider";
import { getUserProfile, createOrder, getCart } from "../../../utils/api";
import styles from "./CheckoutForm.module.scss";

export default function CheckoutForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    full_name: "",
    address: "",
    phone_number: "",
    payment_method: "card",
  });
  const [cart, setCart] = useState({ items: [], total_price: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, cartData] = await Promise.all([
          getUserProfile(),
          getCart(),
        ]);
        setFormData({
          full_name: profileData.full_name || "",
          address: profileData.address || "",
          phone_number: profileData.phone_number || "",
          payment_method: "card",
        });
        setCart(cartData);
      } catch (err) {
        setError(err.message || "Ошибка загрузки данных");
        showToast("Ошибка загрузки данных", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const itemsData = cart.items.map((item) => ({
        variation: item.variation.id,
        quantity: item.quantity,
      }));
      const orderData = {
        items: itemsData,
        payment_method: formData.payment_method,
      };
      await createOrder(orderData);
      showToast("Заказ успешно оформлен", "success");
      navigate("/profile");
    } catch (err) {
      showToast("Ошибка оформления заказа", "error");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.checkout__loading}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.checkout__error}>{error}</div>;
  }

  return (
    <div className={styles.checkout}>
      <h2 className={styles.checkout__title}>Оформление заказа</h2>
      <form onSubmit={handleSubmit} className={styles.checkout__form}>
        <div className={styles.checkout__formGroup}>
          <label htmlFor="full_name" className={styles.checkout__label}>
            ФИО
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleInputChange}
            className={styles.checkout__input}
            required
          />
        </div>
        <div className={styles.checkout__formGroup}>
          <label htmlFor="address" className={styles.checkout__label}>
            Адрес доставки
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={styles.checkout__textarea}
            required
          />
        </div>
        <div className={styles.checkout__formGroup}>
          <label htmlFor="phone_number" className={styles.checkout__label}>
            Номер телефона
          </label>
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleInputChange}
            className={styles.checkout__input}
            required
          />
        </div>
        <div className={styles.checkout__formGroup}>
          <p className={styles.checkout__label}>Способ оплаты</p>
          <div className={styles.checkout__radioGroup}>
            <label className={styles.checkout__radio}>
              <input
                type="radio"
                name="payment_method"
                value="card"
                checked={formData.payment_method === "card"}
                onChange={handleInputChange}
              />
              Картой
            </label>
            <label className={styles.checkout__radio}>
              <input
                type="radio"
                name="payment_method"
                value="sbp"
                checked={formData.payment_method === "sbp"}
                onChange={handleInputChange}
              />
              СБП
            </label>
            <label className={styles.checkout__radio}>
              <input
                type="radio"
                name="payment_method"
                value="cash"
                checked={formData.payment_method === "cash"}
                onChange={handleInputChange}
              />
              Наличными
            </label>
          </div>
        </div>
        <button
          type="submit"
          className={styles.checkout__button}
          disabled={submitting}
        >
          {submitting ? "Оформление..." : "Оформить заказ"}
        </button>
      </form>
    </div>
  );
}
