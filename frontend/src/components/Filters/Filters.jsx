import React from "react";
import styles from "./Filters.module.scss";

export default function Filters({
  tempFilters,
  handleTempFilterChange,
  handleApplyFilters,
  handleClearFilters,
  availableSizes,
  availableColors,
  availableBrands,
}) {
  return (
    <aside className={styles.filters__sidebar}>
      <div className={styles.filters}>
        <h2 className={styles.filters__title}>Фильтры</h2>
        <div className={styles.filters__group}>
          <label htmlFor="price_min" className={styles.filters__label}>
            Минимальная цена
          </label>
          <input
            type="number"
            id="price_min"
            value={tempFilters.price_min}
            onChange={(e) =>
              handleTempFilterChange("price_min", e.target.value)
            }
            className={styles.filters__input}
            placeholder="От"
            aria-label="Минимальная цена"
          />
        </div>
        <div className={styles.filters__group}>
          <label htmlFor="price_max" className={styles.filters__label}>
            Максимальная цена
          </label>
          <input
            type="number"
            id="price_max"
            value={tempFilters.price_max}
            onChange={(e) =>
              handleTempFilterChange("price_max", e.target.value)
            }
            className={styles.filters__input}
            placeholder="До"
            aria-label="Максимальная цена"
          />
        </div>
        <div className={styles.filters__group}>
          <label htmlFor="brand" className={styles.filters__label}>
            Бренд
          </label>
          <select
            id="brand"
            value={tempFilters.brand}
            onChange={(e) => handleTempFilterChange("brand", e.target.value)}
            className={styles.filters__select}
            aria-label="Выбор бренда"
          >
            <option value="">Все бренды</option>
            {availableBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filters__group}>
          <p className={styles.filters__label}>Размер</p>
          <div className={styles.filters__checkboxGroup}>
            {availableSizes.map((size) => (
              <label key={size} className={styles.filters__checkboxLabel}>
                <input
                  type="checkbox"
                  checked={tempFilters.size.includes(size)}
                  onChange={(e) => {
                    const newSizes = e.target.checked
                      ? [...tempFilters.size, size]
                      : tempFilters.size.filter((s) => s !== size);
                    handleTempFilterChange("size", newSizes);
                  }}
                  aria-label={`Размер ${size}`}
                />
                {size}
              </label>
            ))}
          </div>
        </div>
        <div className={styles.filters__group}>
          <p className={styles.filters__label}>Цвет</p>
          <div className={styles.filters__checkboxGroup}>
            {availableColors.map((color) => (
              <label key={color} className={styles.filters__checkboxLabel}>
                <input
                  type="checkbox"
                  checked={tempFilters.color.includes(color)}
                  onChange={(e) => {
                    const newColors = e.target.checked
                      ? [...tempFilters.color, color]
                      : tempFilters.color.filter((c) => c !== color);
                    handleTempFilterChange("color", newColors);
                  }}
                  aria-label={`Цвет ${color}`}
                />
                <span
                  className={styles.filters__colorBox}
                  style={{ backgroundColor: color }}
                ></span>
              </label>
            ))}
          </div>
        </div>
        <div className={styles.filters__buttons}>
          <button
            className={styles.filters__applyButton}
            onClick={handleApplyFilters}
          >
            Применить
          </button>
          <button
            className={styles.filters__clearButton}
            onClick={handleClearFilters}
          >
            Очистить
          </button>
        </div>
      </div>
    </aside>
  );
}
