import React from "react";
import styles from "./DropdownMenu.module.scss";

export default function DropdownMenu({
  title,
  isOpen,
  onToggle,
  items,
  onSelect,
}) {
  return (
    <div
      className={styles.header__dropdown}
      onMouseEnter={onToggle}
      onMouseLeave={onToggle}
    >
      <button className={styles.header__bottomLink} type="button">
        {title}
      </button>
      {isOpen && items.length > 0 && (
        <div className={styles.header__dropdownMenu}>
          {items.map((item) => (
            <button
              key={item.id}
              className={styles.header__dropdownItem}
              onClick={() => onSelect(item.slug)}
              type="button"
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
