import styles from "./Header.module.scss";
import { Link } from "react-router-dom";
import { FiHeart, FiUser, FiShoppingCart } from "react-icons/fi";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.header__top}>
        <div className="container">
          <div className={styles.header__topWrapper}>
            <div className={styles.header__topCategories}>
              <Link to="/" className={styles.header__topLink}>
                Мужское
              </Link>
              <Link to="/" className={styles.header__topLink}>
                Женское
              </Link>
            </div>
            <Link to="/" className={styles.header__logo}>
              Wearly
            </Link>
            <div className={styles.header__functions}>
              <Link to="/" className={styles.header__link}>
                <FiHeart className={styles.header__icon} />
                Избранное
              </Link>
              <Link to="/" className={styles.header__link}>
                <FiUser className={styles.header__icon} />
                Войти
              </Link>
              <Link to="/" className={styles.header__link}>
                <FiShoppingCart className={styles.header__icon} />
                Корзина
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.header__bottom}>
        <div className="container">
          <div className={styles.header__bottomWrapper}>
            <nav className={styles.header__nav}>
              <Link to="/" className={styles.header__bottomLink}>
                Одежда
              </Link>
              <Link to="/" className={styles.header__bottomLink}>
                Обувь
              </Link>
              <Link to="/" className={styles.header__bottomLink}>
                Аксессуары
              </Link>
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
            <input
              type="text"
              name=""
              id=""
              className={styles.header__search}
              placeholder="Поиск..."
            />
          </div>
        </div>
      </div>
    </header>
  );
}
