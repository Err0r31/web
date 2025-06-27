import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { debounce } from "lodash";
import { searchProducts } from "../../../utils/api";
import { PuffLoader } from "react-spinners";
import { AnimatePresence } from "framer-motion";
import SearchResultCard from "../../SearchResultCard/SearchResultCard";
import { useToast } from "../../shared/Toast/ToastProvider";
import styles from "./SearchBar.module.scss";

export default function SearchBar() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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
      setSearchError(err.message || "Search query failed");
      showToast(err.message || "Search query failed", "error");
    } finally {
      setIsLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

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

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      setSearchResults([]);
      setIsSearchExpanded(false);
    }
  };

  return (
    <div className={styles.header__searchWrapper} ref={searchRef} role="search">
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
        role="combobox"
      />
      {isLoading && (
        <div className={styles.header__searchLoading} aria-live="polite">
          <PuffLoader color="#3E549D" size={24} />
          <span className="sr-only">Загрузка результатов...</span>
        </div>
      )}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <div
            id="search-results"
            className={styles.headerSearchResults}
            role="listbox"
            aria-label="Search results"
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
          </div>
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
  );
}
