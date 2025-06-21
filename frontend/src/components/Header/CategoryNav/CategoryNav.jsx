import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DropdownMenu from "../DropdownMenu/DropdownMenu";
import styles from "./CategoryNav.module.scss";

export default function CategoryNav({ categories }) {
  const [menuOpen, setMenuOpen] = useState(null);
  const navigate = useNavigate();

  const topCategories = categories.filter((cat) => !cat.parent);
  const clothes = topCategories.find((cat) =>
    cat.name.toLowerCase().includes("одежда")
  );
  const shoes = topCategories.find((cat) =>
    cat.name.toLowerCase().includes("обувь")
  );
  const accessories = topCategories.find((cat) =>
    cat.name.toLowerCase().includes("аксессуары")
  );

  const getSubcategories = (parentId) =>
    categories.filter((cat) => cat.parent === parentId);

  return (
    <nav
      className={styles.header__nav}
      role="navigation"
      aria-label="Категории товаров"
    >
      <DropdownMenu
        title="Одежда"
        isOpen={menuOpen === "clothes"}
        onToggle={() => setMenuOpen(menuOpen === "clothes" ? null : "clothes")}
        items={clothes ? getSubcategories(clothes.id) : []}
        onSelect={(slug) => {
          setMenuOpen(null);
          navigate(`/category/${slug}`);
        }}
      />
      <DropdownMenu
        title="Обувь"
        isOpen={menuOpen === "shoes"}
        onToggle={() => setMenuOpen(menuOpen === "shoes" ? null : "shoes")}
        items={shoes ? getSubcategories(shoes.id) : []}
        onSelect={(slug) => navigate(`/category/${slug}`)}
      />
      <DropdownMenu
        title="Аксессуары"
        isOpen={menuOpen === "accessories"}
        onToggle={() =>
          setMenuOpen(menuOpen === "accessories" ? null : "accessories")
        }
        items={accessories ? getSubcategories(accessories.id) : []}
        onSelect={(slug) => navigate(`/category/${slug}`)}
      />
      <Link to="/" className={styles.header__bottomLink}>
        Новинки
      </Link>
      <Link to="/" className={styles.header__bottomLink}>
        Образы
      </Link>
      <Link
        to="/"
        className={`${styles.header__bottomLink} ${styles.header__sales}`}
      >
        Скидки %
      </Link>
    </nav>
  );
}
