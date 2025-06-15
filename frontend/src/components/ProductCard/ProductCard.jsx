import { Link } from "react-router-dom";
import styles from "./ProductCard.module.scss";

export default function ProductCard({ image, name, category, price, totalPrice, discount, id }) {
  return (
    <article role="article" aria-labelledby={`product-name-${id}`} style={{display: 'flex'}}>
      <Link
        to={`/products/${id}`}
        className={styles.productCard}
        aria-label={`${name}, ${category}, Цена: ${price} рублей`}
      >
        <img
          src={image}
          alt={`Изображение товара ${name}`}
          className={styles.productCard__image}
          loading="lazy"
        />
        {discount > 0 ? (
          <div className={styles.productCard__priceDiscount}>
            <p className={styles.productCard__oldPrice}>{price} {" "}</p>
            <p className={styles.productCard__totalPrice}>{totalPrice} ₽</p>
          </div>
        ) : (
          <p
          className={styles.productCard__price}
          aria-label={`Цена: ${totalPrice} рублей`}
        >
          {totalPrice} ₽
        </p>
        )}
        <div className={styles.productCard__textWrapper}>
          <h3 id={`product-name-${id}`} className={styles.productCard__title}>
            {name}
          </h3>
          <p className={styles.productCard__category}>{category}</p>
        </div>
        <button
          className={styles.productCard__link}
          onClick={() => (window.location.href = `/products/${id}`)}
          aria-label={`Купить ${name}`}
        >
          Купить
        </button>
      </Link>
    </article>
  );
}
