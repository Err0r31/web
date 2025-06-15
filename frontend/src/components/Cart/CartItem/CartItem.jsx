import styles from "./CartItem.module.scss";

export default function CartItem({ item, formatPrice, onUpdateQuantity, onDelete }) {
  const variation = item.variation || {};
  const product = item.product || variation.product || {};
  const total_price = product.total_price || 0;
  const itemId = item.id || item.variation_id;

  console.log("Продукт:", product);

  return (
    <div className={styles.cartItem} role="group" aria-label={`Товар в корзине: ${product.name}`}>
      <img
        src={
          product.color_images?.find((img) => img.color === variation.color)?.image ||
          product.image ||
          "/placeholder.png"
        }
        alt={product.name || "Товар"}
        className={styles.cartItem__image}
        loading="lazy"
      />
      <div className={styles.cartItem__details}>
        <h2 className={styles.cartItem__name}>{product.name}</h2>
        <p className={styles.cartItem__brand}>{product.brand}</p>
        <div className={styles.cartItem__info}>
          <p>Размер: {variation.size || "N/A"}</p>
          <p className={styles.cartItem__infoColor}>
            Цвет:{" "}
            <span
              className={styles.cartItem__infoSwatch}
              style={{ backgroundColor: variation.color}}
            >  </span>{" "}
          </p>
        </div>
      </div>
      <div className={styles.cartItem__actions}>
        { product.discount > 0 ? (
          <div className={styles.cartItem__discountWrapper}>
            <p className={styles.cartItem__oldPrice}>{formatPrice(product.price * item.quantity)}</p>
            <p className={styles.cartItem__newPrice}>{formatPrice(total_price * item.quantity)} ₽</p>
          </div>
        ) : (
          <p className={styles.cartItem__price}>{formatPrice(total_price * item.quantity)} ₽</p>
        )}
        <div className={styles.cartItem__quantity} role="group" aria-label="Изменение количества">
          <button
            onClick={() => onUpdateQuantity(itemId, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className={styles.cartItem__quantity_button}
            aria-label="Уменьшить количество"
          >
            -
          </button>
          <span className={styles.cartItem__quantity_value}>{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(itemId, item.quantity + 1)}
            disabled={item.quantity >= variation.stock}
            className={styles.cartItem__quantity_button}
            aria-label="Увеличить количество"
          >
            +
          </button>
        </div>
        <button
          onClick={() => onDelete(itemId)}
          className={styles.cartItem__delete}
          aria-label={`Удалить ${product.name} из корзины`}
        >
          Удалить
        </button>
      </div>
    </div>
  );
};
