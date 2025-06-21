import React from "react";
import { Link } from "react-router-dom";
import GenderSwitch from "../GenderSwitch/GenderSwitch";
import UserMenu from "../UserMenu/UserMenu";
import styles from "./HeaderTop.module.scss";

export default function HeaderTop() {
  return (
    <div className={styles.header__top}>
      <div className="container">
        <div className={styles.header__topWrapper}>
          <GenderSwitch />
          <Link
            to="/"
            className={styles.header__logo}
            aria-label="Wearly - На главную"
          >
            <span className={styles.header__logoText}>Wearly</span>
            <span className={styles.header__logoSmall}>W</span>
          </Link>
          <UserMenu />
        </div>
      </div>
    </div>
  );
}