import React from "react";
import { Link } from "react-router-dom";
import { FiUser, FiLogOut, FiShoppingCart } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { AuthContext } from "../../../context/AuthContext";
import { useToast } from "../../shared/Toast/ToastProvider";
import { useNavigate } from "react-router-dom";
import styles from "./UserMenu.module.scss";

export default function UserMenu() {
  const { isAuthenticated, handleLogout } = React.useContext(AuthContext);
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
    <div
      className={styles.header__functions}
      role="navigation"
      aria-label="Пользовательское меню"
    >
      {isAuthenticated ? (
        <button
          onClick={handleLogoutClick}
          className={styles.header__link}
          aria-label="Выйти из аккаунта"
        >
          <FiLogOut className={styles.header__icon} aria-hidden="true" />
          <span>Выйти</span>
        </button>
      ) : (
        <Link
          to="/register"
          className={styles.header__link}
          aria-label="Войти в аккаунт"
        >
          <FiUser className={styles.header__icon} aria-hidden="true" />
          <span>Войти</span>
        </Link>
      )}
      <Link to="/cart" className={styles.header__link} aria-label="Корзина">
        <FiShoppingCart className={styles.header__icon} aria-hidden="true" />
        <span>Корзина</span>
      </Link>
      {isAuthenticated ? (
        <Link
          to="/profile"
          className={styles.header__link}
          aria-label="Профиль"
        >
          <CgProfile className={styles.header__icon} aria-hidden="true" />
          <span>Профиль</span>
        </Link>
      ) : (
        <></>
      )}
    </div>
  );
}
