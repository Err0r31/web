import React from "react";
import styles from "./CheckoutSummary.module.scss";

export default function CheckoutSummary({ cart }) {
  const formatPrice = (price) => Number(price).toLocaleString("ru-RU");

  return (
    <div className={styles.summary}>
      <h2 className={styles.summary__title}>Итог заказа</h2>
      <div className={styles.summary__items}>
        {cart.items.map((item) => (
          <div key={item.id || item.variation_id} className={styles.summary__item}>
            <p>{item.variation.product.name} ({item.variation.size}, {item.variation.color})</p>
            <p>Количество: {item.quantity}</p>
            <p>Цена: {formatPrice(item.variation.product.total_price)} ₽</p>
          </div>
        ))}
      </div>
      <p className={styles.summary__total}>
        Итого: {formatPrice(cart.total_price)} ₽
      </p>
    </div>
  );
}