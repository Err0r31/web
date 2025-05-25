import React, { useState, useEffect } from "react";
import { getRecommendedProducts } from "../../utils/api";
import { PuffLoader } from "react-spinners";
import ProductCard from "../ProductCard/ProductCard";
import styles from "./RecommendedList.module.scss";

export default function RecommendedList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const data = await getRecommendedProducts();
        setProducts(data);
      } catch (err) {
        setError(err.message || "Ошибка загрузки товаров");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="container">
        <div className={styles.recommendedList__loading}>
          <PuffLoader color="#3E549D" size={60} />
        </div>
      </div>
    );
  }

  if (error)
    return (
      <div className="container">
        <div className={styles.recommendedList__error}>{error}</div>
      </div>
    );

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
