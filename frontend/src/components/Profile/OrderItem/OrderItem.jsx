import React from "react";
import styles from "./OrderItem.module.scss";

export default function OrderItem({ order }) {
  const formatPrice = (price) => Number(price).toLocaleString("ru-RU");

  return (
    <div className={styles.orderItem}>
      <div className={styles.orderItem__header}>
        <h3 className={styles.orderItem__title}>
          Заказ #{order.order_number}
        </h3>
        <p className={styles.orderItem__status}>
          Статус: {order.status === 'pending' ? 'Ожидает' :
                    order.status === 'processing' ? 'В обработке' :
                    order.status === 'shipped' ? 'Отправлен' :
                    order.status === 'delivered' ? 'Доставлен' :
                    'Отменён'}
        </p>
      </div>
      <p className={styles.orderItem__date}>
        Дата: {new Date(order.order_date).toLocaleDateString("ru-RU")}
      </p>
      <p className={styles.orderItem__method}>
        Способ оплаты: {order.payment_method === 'card' ? 'Картой' :
                         order.payment_method === 'sbp' ? 'СБП' :
                         'Наличными'}
      </p>
      <div className={styles.orderItem__items}>
        {order.items.map((item) => (
          <div key={item.id} className={styles.orderItem__item}>
            <p>{item.product_name} ({item.size}, {item.color})</p>
            <p>Количество: {item.quantity}</p>
            <p>Цена: {formatPrice(item.price)} ₽</p>
          </div>
        ))}
      </div>
      <p className={styles.orderItem__total}>
        Итого: {formatPrice(order.total_price)} ₽
      </p>
    </div>
  );
}