import styles from "./CartSummary.module.scss";

export default function CartSummary({ cart, formatPrice }) {
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const originalPrice = cart.items.reduce(
    (sum, item) => sum + (item.variation?.product?.price || 0) * item.quantity,
    0
  );
  const discount = originalPrice - cart.total_price;

  console.log(cart);

  return (
    <div className={styles.cartSummary}>
      <h2 className={styles.cartSummary__title}>Сумма заказа</h2>
      <div className={styles.cartSummary__topWrapper}>
        <div className={styles.cartSummary__row}>
          <span>Товары ({itemCount}):</span>
          <span>{originalPrice} ₽</span>
        </div>
        {discount > 0 && (
          <div
            className={`${styles.cartSummary__row} ${styles.cartSummary__rowDiscount}`}
          >
            <span>Скидка:</span>
            <span>-{formatPrice(discount)} ₽</span>
          </div>
        )}
      </div>
      <div className={styles.cartSummary__bottomWrapper}>
          <div
            className={`${styles.cartSummary__row} ${styles.cartSummary__rowTotal}`}
          >
            <span>Итого:</span>
            <span>{formatPrice(cart.total_price)} ₽</span>
          </div>
          <button
            className={styles.cartSummary__checkout}
            aria-label="Перейти к оформлению"
          >
            Перейти к оформлению
          </button>
      </div>
    </div>
  );
}
