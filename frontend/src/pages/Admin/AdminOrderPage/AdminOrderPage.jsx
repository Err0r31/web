import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getOrders, updateOrderStatus, cancelOrder } from "../../../utils/api";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/Footer/Footer";
import styles from "./AdminOrderPage.module.scss";

export default function AdminOrderPage() {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (user !== null) {
      setCheckingAuth(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error("Ошибка загрузки заказов:", err);
      }
    };
    fetchOrders();
  }, [user]);

  const handelStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error("Ошибка обновления статуса:", err);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    } catch (err) {
      console.error("Ошибка отмены заказа:", err);
    }
  };

  if (checkingAuth) {
    return null;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <>
      <Header />
      <div className={styles.adminOrders}>
        <div className="container">
          <div className={styles.adminOrders__wrapper}>
            <h1 className={styles.adminOrders__title}>Управление заказами</h1>
            <div className={styles.adminOrders__list}>
              {orders.map((order) => (
                <div key={order.id} className={styles.adminOrders__item}>
                  <div className={styles.adminOrders__card}>
                    <div className={styles.adminOrders__cardHeader}>
                      <h3 className={styles.adminOrders__cardTitle}>Заказ №{order.order_number}</h3>
                      <span
                        className={`${styles.adminOrders__cardStatus} ${styles[`adminOrders__cardStatus--${order.status.toLowerCase()}`]}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className={styles.adminOrders__cardDetails}>
                      <p>
                        <strong>Пользователь:</strong> {order.user}
                      </p>
                      <p>
                        <strong>Дата:</strong>{" "}
                        {new Date(order.order_date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={styles.adminOrders__actions}>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handelStatusChange(order.id, e.target.value)
                      }
                      name="statusChanger"
                      id={`statusChanger_${order.id}`}
                      className={styles.adminOrders__select}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="processing">В обработке</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                    </select>
                    {order.status !== "cancelled" &&
                      order.status !== "delivered" && (
                        <button
                          onClick={() => handleCancel(order.id)}
                          className={styles.adminOrders__cancel}
                        >
                          Отменить заказ
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
