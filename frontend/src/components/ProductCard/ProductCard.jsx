import { Link } from "react-router-dom";
import styles from "./ProductCard.module.scss";

export default function ProductCard({ image, name, category, price, id }) {
  return (
    <article role="article" aria-labelledby={`product-name-${id}`}>
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
        <p
          className={styles.productCard__price}
          aria-label={`Цена: ${price} рублей`}
        >
          {price} ₽
        </p>
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
