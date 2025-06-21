import React, { useState, useEffect } from "react";
import { useToast } from "../../shared/Toast/ToastProvider";
import { getUserProfile, updateUserProfile } from "../../../utils/api";
import styles from "./ProfileInfo.module.scss";

export default function ProfileInfo() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    address: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setUser(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          address: data.address || "",
          phone_number: data.phone_number || "",
        });
      } catch (err) {
        setError(err.message || "Ошибка загрузки профиля");
        showToast("Ошибка загрузки профиля", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await updateUserProfile(formData);
      setUser(updatedUser);
      setIsEditing(false);
      showToast("Данные успешно обновлены", "success");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className={styles.profile__loading}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.profile__error}>{error}</div>;
  }

  return (
    <div className={styles.profile}>
      <h2 className={styles.profile__title}>Личные данные</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit} className={styles.profile__form}>
          <div className={styles.profile__formGroup}>
            <label htmlFor="full_name" className={styles.profile__label}>
              ФИО
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className={styles.profile__input}
              required
            />
          </div>
          <div className={styles.profile__formGroup}>
            <label htmlFor="email" className={styles.profile__label}>
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={styles.profile__input}
              required
            />
          </div>
          <div className={styles.profile__formGroup}>
            <label htmlFor="address" className={styles.profile__label}>
              Адрес
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className={styles.profile__textarea}
            />
          </div>
          <div className={styles.profile__formGroup}>
            <label htmlFor="phone_number" className={styles.profile__label}>
              Номер телефона
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={styles.profile__input}
            />
          </div>
          <div className={styles.profile__buttonGroup}>
            <button type="submit" className={styles.profile__button}>
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className={styles.profile__buttonSecondary}
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.profile__info}>
          <p className={styles.profile__text}>
            <strong>ФИО:</strong> {user.full_name || "Не указано"}
          </p>
          <p className={styles.profile__text}>
            <strong>Email:</strong> {user.email || "Не указано"}
          </p>
          <p className={styles.profile__text}>
            <strong>Адрес:</strong> {user.address || "Не указано"}
          </p>
          <p className={styles.profile__text}>
            <strong>Номер телефона:</strong> {user.phone_number || "Не указано"}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className={styles.profile__button}
          >
            Редактировать
          </button>
        </div>
      )}
    </div>
  );
}