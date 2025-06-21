import React from "react";
import CategoryNav from "../CategoryNav/CategoryNav";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./HeaderBottom.module.scss";

export default function HeaderBottom({ categories }) {
  return (
    <div className={styles.header__bottom}>
      <div className="container">
        <div className={styles.header__bottomWrapper}>
          <CategoryNav categories={categories} />
          <SearchBar />
        </div>
      </div>
    </div>
  );
}