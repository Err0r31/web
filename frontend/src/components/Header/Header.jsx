import styles from "./Header.module.scss";
import { Link } from "react-router-dom";
import { FiHeart, FiUser, FiShoppingCart, FiLogOut } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useToast } from "../shared/Toast/ToastProvider.jsx";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { isAuthenticated, handleLogout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      showToast("Выход выполнен успешно!", "success");
      navigate("/");
    } catch (err) {
      showToast(err.message || "Ошибка при выходе", "error");
    }
  };

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
              {isAuthenticated ? (
                <button
                  onClick={handleLogoutClick}
                  className={styles.header__link}
                >
                  <FiLogOut className={styles.header__icon} />
                  Выйти
                </button>
              ) : (
                <Link to="/register" className={styles.header__link}>
                  <FiUser className={styles.header__icon} />
                  Войти
                </Link>
              )}
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
