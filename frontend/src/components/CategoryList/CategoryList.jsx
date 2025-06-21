import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CategoryList.module.scss";

export default function CategoryList({ categories, currentCategorySlug }) {
  const navigate = useNavigate();

  return (
    <div className={styles.categories__wrapper}>
      <h2 className={styles.category__subtitle}>Категории</h2>
      <ul className={styles.category__list}>
        {categories.map((category) => (
          <li key={category.id} className={styles.category__item}>
            <button
              className={`${styles.category__link} ${
                currentCategorySlug === category.slug
                  ? styles.category__link_active
                  : ""
              }`}
              onClick={() => navigate(`/category/${category.slug}`)}
              aria-current={
                currentCategorySlug === category.slug ? "page" : undefined
              }
            >
              {category.name}
            </button>
            {category.subcategories && category.subcategories.length > 0 && (
              <ul className={styles.category__sublist}>
                {category.subcategories.map((sub) => (
                  <li key={sub.id} className={styles.category__subitem}>
                    <button
                      className={`${styles.category__link} ${
                        currentCategorySlug === sub.slug
                          ? styles.category__link_active
                          : ""
                      }`}
                      onClick={() => navigate(`/category/${sub.slug}`)}
                      aria-current={
                        currentCategorySlug === sub.slug ? "page" : undefined
                      }
                    >
                      {sub.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
