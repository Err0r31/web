import React from "react";
import { Link } from 'react-router-dom';
import styles from './SearchResultCard.module.scss';

export default function SearchResultCard({ id, image, name, price }) {
    return (
        <Link to={`/products/${id}`} className={styles.searchResultCard}>
            <img src={image} alt={name} className={styles.searchResultCard__image} loading="lazy" />
            <div className={styles.searchResultCard__info}>
                <h3 className={styles.searchResultCard__name}>{name}</h3>
                <p className={styles.searchResultCard__price}>{price} ₽</p>
            </div>
        </Link>
    );
}