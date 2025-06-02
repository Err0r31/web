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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
    return () => debouncedSearch.cancel();
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

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearchExpanded(false);
    }
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.header__top}>
        <div className="container">
          <div className={styles.header__topWrapper}>
            <nav className={styles.header__topCategories} role="navigation" aria-label="Основные категории">
              <Link to="/" className={styles.header__topLink}>
                Мужское
              </Link>
              <Link to="/" className={styles.header__topLink}>
                Женское
              </Link>
            </nav>
            <Link to="/" className={styles.header__logo} aria-label="Wearly - На главную">
              Wearly
            </Link>
            <div className={styles.header__functions} role="navigation" aria-label="Пользовательское меню">
              <Link to="/" className={styles.header__link} aria-label="Избранное">
                <FiHeart className={styles.header__icon} aria-hidden="true" />
                <span>Избранное</span>
              </Link>
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
                <Link to="/register" className={styles.header__link} aria-label="Войти в аккаунт">
                  <FiUser className={styles.header__icon} aria-hidden="true" />
                  <span>Войти</span>
                </Link>
              )}
              <Link to="/" className={styles.header__link} aria-label="Корзина">
                <FiShoppingCart className={styles.header__icon} aria-hidden="true" />
                <span>Корзина</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.header__bottom}>
        <div className="container">
          <div className={styles.header__bottomWrapper}>
            <nav className={styles.header__nav} role="navigation" aria-label="Категории товаров">
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
            <div 
              className={styles.header__searchWrapper} 
              ref={searchRef}
              role="search"
            >
              <input
                type="text"
                className={styles.header__search}
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                aria-label="Поиск по сайту"
                aria-expanded={isSearchExpanded}
                aria-controls="search-results"
                aria-describedby={searchError ? "search-error" : undefined}
              />
              {isLoading && (
                <div className={styles.header__searchLoading} aria-live="polite">
                  <PuffLoader color="#3E549D" size={24} />
                  <span className="sr-only">Загрузка результатов...</span>
                </div>
              )}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    id="search-results"
                    className={styles.header__searchResults}
                    role="listbox"
                    aria-label="Результаты поиска"
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
                <div 
                  id="search-error"
                  className={styles.header__searchError}
                  role="alert"
                >
                  {searchError}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
