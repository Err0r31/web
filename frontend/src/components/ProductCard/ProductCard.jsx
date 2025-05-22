import styles from "./ProductCard.module.scss";

export default function ProductCard({ image, name, category, price }) {
    return (
        <div className={styles.productCard}>
            <img src={image} alt={name} className={styles.productCard__image} loading="lazy" />
            <p className={styles.productCard__price}>{price} ₽</p>
            <div className={styles.productCard__textWrapper}>
                <h3 className={styles.productCard__title}>{name}</h3>
                <p className={styles.productCard__category}>{category}</p>
            </div>
            <button className={styles.productCard__link}>Купить</button>
        </div>
    );
}