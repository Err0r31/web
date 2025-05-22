import styles from "./OutfitCard.module.scss";

export default function OutfitCard({ image, name, price }) {
    return (
    <div className={styles.outfitCard}>
        <img src={image} alt={name} className={styles.outfitCard__image} />
        <div className={styles.outfitCard__textWrapper}>
            <h3 className={styles.outfitCard__title}>{name}</h3>
            <p className={styles.outfitCard__price}>{price} ₽</p>
        </div>
    </div>
    )
}