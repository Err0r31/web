import { Link } from "react-router-dom";
import { FaTelegram, FaWhatsappSquare } from "react-icons/fa";
import { FaVk } from "react-icons/fa6";

import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footer__wrapper}>
          <Link to="/" className={styles.footer__logo}>
            Wearly
          </Link>
          <div className={styles.footer__section}>
            <h4 className={styles.footer__title}>Помощь</h4>
            <ul className={styles.footer__list}>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  Оплата
                </Link>
              </li>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  Возврат
                </Link>
              </li>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  Доставка
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.footer__section}>
            <h4 className={styles.footer__title}>Контакты</h4>
            <ul className={styles.footer__list}>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  Обратная связь
                </Link>
              </li>
              <li className={styles.footer__item}>
                <a className={styles.footer__link} href="tel:89999999999">
                  8 (999)-999-99-99
                </a>
              </li>
              <li className={styles.footer__itemSocials}>
                <Link
                  className={styles.footer__link}
                  to="/"
                >
                  <FaTelegram />
                </Link>
                <Link
                  className={styles.footer__link}
                  to="/"
                >
                  <FaWhatsappSquare />
                </Link>
                <Link
                  className={styles.footer__link}
                  to="/"
                >
                  <FaVk />
                </Link>
              </li>
            </ul>
          </div>
          <div className={styles.footer__section}>
            <h4 className={styles.footer__title}>Компания</h4>
            <ul className={styles.footer__list}>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  О компании
                </Link>
              </li>
              <li className={styles.footer__item}>
                <Link className={styles.footer__link} to="/">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
