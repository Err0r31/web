import React, { useState, useEffect } from "react";

import styles from "./RecommendedList.module.scss";
import ProductCard from "../ProductCard/ProductCard";

export default function RecommendedList() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendedProducts() {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/random-recommended-products/"
        );
        if (!response.ok) {
          throw new Error("Ошибка при загрузке товаров");
        }
        const result = await response.json();
        setProducts(result);
      } catch (error) {
        setError(error.message);
      }
    }
    fetchRecommendedProducts();
  }, []);

  if (error)
    return <div className={styles.RecommendedList__error}>{error}</div>;

  return (
    <div className="container">
      <h2 className={styles.recommendedList__title}>Рекомендации</h2>
      <div className={styles.recommendedList__wrapper}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              image={product.image}
              name={product.name}
              category={product.last_category_name}
              price={product.total_price}
            />
          ))}
      </div>
    </div>
  );
}
