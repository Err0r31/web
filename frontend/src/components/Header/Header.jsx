import React, { useState, useEffect } from "react";
import HeaderTop from "./HeaderTop/HeaderTop";
import HeaderBottom from "./HeaderBottom/HeaderBottom";
import { getCategories } from "../../utils/api";
import { useGender } from "../../context/GenderContext";
import styles from "./Header.module.scss";

export default function Header() {
  const { gender } = useGender();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories(gender).then(setCategories);
  }, [gender]);

  return (
    <header className={styles.header} role="banner">
      <HeaderTop />
      <HeaderBottom categories={categories} />
    </header>
  );
}