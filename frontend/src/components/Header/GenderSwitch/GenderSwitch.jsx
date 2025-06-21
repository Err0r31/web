import React from "react";
import { useNavigate } from "react-router-dom";
import { useGender } from "../../../context/GenderContext";
import styles from "./GenderSwitch.module.scss";

export default function GenderSwitch() {
  const { gender, setGender } = useGender();
  const navigate = useNavigate();

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    navigate("/");
  };

  return (
    <nav
      className={styles.header__topCategories}
      role="navigation"
      aria-label="Основные категории"
    >
      <button
        className={`${styles.header__topLink} ${
          gender === "male" ? styles.active : ""
        }`}
        onClick={() => handleGenderChange("male")}
      >
        Мужское
      </button>
      <button
        className={`${styles.header__topLink} ${
          gender === "female" ? styles.active : ""
        }`}
        onClick={() => handleGenderChange("female")}
      >
        Женское
      </button>
    </nav>
  );
}