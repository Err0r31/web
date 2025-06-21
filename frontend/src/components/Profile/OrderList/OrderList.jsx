import React, { useState, useEffect } from "react";
import { useToast } from "../../shared/Toast/ToastProvider";
import { getUserOrders } from "../../../utils/api";
import OrderItem from "../OrderItem/OrderItem";
import styles from "./OrderList.module.scss";

export default function OrderList() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getUserOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || "Ошибка загрузки заказов");
        showToast("Ошибка загрузки заказов", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [showToast]);


  if (loading) {
    return <div className={styles.orderList__loading}>Загрузка...</div>;
  }

  if (error) {
    return <div className={styles.orderList__error}>{error}</div>;
  }

  if (!orders.length) {
    return <div className={styles.orderList__empty}>Заказы отсутствуют</div>;
  }

  return (
    <div className={styles.orderList}>
      <h2 className={styles.orderList__title}>Мои заказы</h2>
      <div className={styles.orderList__items}>
        {orders.map((order) => (
          <OrderItem key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}