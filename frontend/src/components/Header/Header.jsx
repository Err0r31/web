import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiHeart, FiUser, FiLogOut, FiShoppingCart } from "react-icons/fi";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../shared/Toast/ToastProvider";
import { debounce } from "lodash";
import { searchProducts } from "../../utils/api";
import { PuffLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import SearchResultCard from "../SearchResultCard/SearchResultCard";
import styles from "./Header.module.scss";

export default function Header() {
  const { isAuthenticated, handleLogout } = React.useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchRef = useRef(null);

  const debouncedSearch = debounce(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    try {
      setIsLoading(true);
      const results = await searchProducts(query);
      setSearchResults(results);
      setSearchError(null);
    } catch (err) {
      setSearchError(err.message || "Ошибка поиска");
      showToast(err.message || "Ошибка поиска", "error");
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel(); // Очистка при размонтировании
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            <div className={styles.header__searchWrapper} ref={searchRef}>
              <input
                type="text"
                className={styles.header__search}
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isLoading && (
                <div className={styles.header__searchLoading}>
                  <PuffLoader color="#3E549D" size={24} />
                </div>
              )}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    className={styles.header__searchResults}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {searchResults.map((product) => (
                      <SearchResultCard
                        key={product.id}
                        id={product.id}
                        image={product.image}
                        name={product.name}
                        price={product.total_price}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              {searchError && (
                <div className={styles.header__searchError}>{searchError}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
