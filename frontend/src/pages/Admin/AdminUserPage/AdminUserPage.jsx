import React, { useState, useEffect, useContext } from "react";
import { useToast } from "../../../components/shared/Toast/ToastProvider";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import styles from "./AdminUserPage.module.scss";
import {
  deleteUser,
  getUsers,
  toggleUserAdmin,
  toggleUserBlock,
} from "../../../utils/api";

export default function AdminUserPage() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user !== null) {
      setCheckingAuth(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        setError(err.message || "Ошибка загрузки пользователей");
        showToast("Ошибка загрузки пользователей", "error");
      }
    };

    fetchUsers();
  }, [user, showToast]);

  const handleToggleBlock = async (userId, isActive) => {
    try {
      await toggleUserBlock(userId, !isActive);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
      );
      showToast(
        `Пользователь ${isActive ? "заблокирован" : "разблокирован"}`,
        "success"
      );
    } catch (err) {
      console.error("Ошибка изменения статуса:", err);
      showToast("Ошибка изменения статуса", "error");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Вы уверены, что хотите удалить пользователя?")) return;
    try {
      await deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      showToast("Пользователь удален", "success");
    } catch (err) {
      console.error("Ошибка удаления пользователя:", err);
      showToast("Ошибка удаления пользователя", "error");
    }
  };

  const handleToggleAdmin = async (userId, isStaff) => {
    try {
      await toggleUserAdmin(userId, !isStaff);
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, is_staff: !isStaff } : u))
      );
      showToast(
        `Роль пользователя ${isStaff ? "снята" : "назначена"}`,
        "success"
      );
    } catch (err) {
      console.error("Ошибка изменения роли:", err);
      showToast("Ошибка изменения роли", "error");
    }
  };

  if (checkingAuth) {
    return null;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.error} role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="content" id="main-content">
        <div className="container">
          <div className={styles.users}>
            <h1 className={styles.users__title}>Управление пользователями</h1>
            <div className={styles.users__tableWrapper}>
              <table className={styles.users__table} role="grid">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Имя пользователя</th>
                    <th scope="col">Email</th>
                    <th scope="col">Статус</th>
                    <th scope="col">Роль</th>
                    <th scope="col">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.is_active ? "Активен" : "Заблокирован"}</td>
                      <td>{u.is_staff ? "Администратор" : "Пользователь"}</td>
                      <td className={styles.users__actions}>
                        <button
                          onClick={() => handleToggleBlock(u.id, u.is_active)}
                          className={styles.users__actionButton}
                          aria-label={
                            u.is_active
                              ? "Заблокировать пользователя"
                              : "Разблокировать пользователя"
                          }
                        >
                          {u.is_active ? "Блокировать" : "Разблокировать"}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className={`${styles.users__actionButton} ${styles.users__deleteButton}`}
                          aria-label="Удалить пользователя"
                        >
                          Удалить
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(u.id, u.is_staff)}
                          className={styles.users__actionButton}
                          aria-label={
                            u.is_staff
                              ? "Снять роль администратора"
                              : "Назначить администратором"
                          }
                        >
                          {u.is_staff ? "Снять админ" : "Сделать админом"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
