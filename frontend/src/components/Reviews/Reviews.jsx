import React, { useState, useContext } from "react";
import { useToast } from "../shared/Toast/ToastProvider";
import { AuthContext } from "../../context/AuthContext";
import { addReview, updateReview, deleteReview, getProduct } from "../../utils/api";
import { FiEdit } from "react-icons/fi";
import { MdOutlineDelete } from "react-icons/md";
import styles from "./Reviews.module.scss";

export default function Reviews({ productId, reviews, setProduct }) {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const { showToast } = useToast();
  const { isAuthenticated, user } = useContext(AuthContext);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast("Войдите, чтобы оставить отзыв", "warning");
      return;
    }
    const reviewData = {
      product: productId,
      rating,
      comment: reviewText,
    };
    try {
      await addReview(productId, reviewData);
      showToast("Отзыв успешно отправлен", "success");
      setReviewText("");
      setRating(5);
      const updatedProduct = await getProduct(productId);
      setProduct(updatedProduct);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditText(review.comment || "");
    setEditRating(review.rating);
  };

  const handleUpdateReview = async (e, reviewId) => {
    e.preventDefault();
    try {
      const reviewData = {
        rating: editRating,
        comment: editText,
        product: productId,
      };
      await updateReview(productId, reviewId, reviewData);
      showToast("Отзыв успешно обновлен", "success");
      setEditingReviewId(null);
      setEditText("");
      setEditRating(5);
      const updatedProduct = await getProduct(productId);
      setProduct(updatedProduct);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Вы уверены, что хотите удалить отзыв?")) return;
    try {
      await deleteReview(productId, reviewId);
      showToast("Отзыв успешно удален", "success");
      const updatedProduct = await getProduct(productId);
      setProduct(updatedProduct);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section className={styles.reviews} aria-labelledby="reviews-title">
      <h2 id="reviews-title" className={styles.reviews__title}>Отзывы</h2>
      {reviews?.length > 0 ? (
        <ul className={styles.reviews__list} role="list">
          {reviews.map((review) => (
            <li key={review.id} className={styles.reviews__item}>
              {editingReviewId === review.id ? (
                <form
                  onSubmit={(e) => handleUpdateReview(e, review.id)}
                  className={styles.reviews__form}
                  aria-label="Редактирование отзыва"
                >
                  <div className={styles.reviews__group}>
                    <label className={styles.reviews__label} htmlFor={`edit-rating-${review.id}`}>
                      Рейтинг:
                    </label>
                    <select
                      className={styles.reviews__select}
                      id={`edit-rating-${review.id}`}
                      value={editRating}
                      onChange={(e) => setEditRating(Number(e.target.value))}
                      required
                      aria-label="Выберите рейтинг"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value} {`${"★".repeat(value)}${" ☆".repeat(5-value)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.reviews__group}>
                    <label className={styles.reviews__label} htmlFor={`edit-comment-${review.id}`}>
                      Комментарий:
                    </label>
                    <textarea
                      className={styles.reviews__textarea}
                      id={`edit-comment-${review.id}`}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      required
                      placeholder="Ваш отзыв..."
                      aria-label="Введите текст отзыва"
                    />
                  </div>
                  <div className={styles.reviews__buttonGroup}>
                    <button 
                      type="submit" 
                      className={styles.reviews__button}
                      aria-label="Сохранить изменения"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      className={styles.reviews__button}
                      onClick={() => setEditingReviewId(null)}
                      aria-label="Отменить редактирование"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              ) : (
                <article className={styles.reviews__content} aria-label={`Отзыв от ${review.user || "Анонима"}`}>
                  <div className={styles.reviews__topWrapper}>
                    <p className={styles.reviews__user}>
                      {review.user || "Аноним"}
                    </p>
                    <div className={styles.reviews__topRightWrapper}>
                      {isAuthenticated && user && review.user_id === user.id && (
                        <div 
                          className={styles.reviews__actions}
                          role="group"
                          aria-label="Действия с отзывом"
                        >
                          <button
                            className={styles.reviews__actionButton}
                            onClick={() => handleEditReview(review)}
                            aria-label="Редактировать отзыв"
                          >
                            <FiEdit aria-hidden="true" />
                          </button>
                          <button
                            className={styles.reviews__actionButton}
                            onClick={() => handleDeleteReview(review.id)}
                            aria-label="Удалить отзыв"
                          >
                            <MdOutlineDelete aria-hidden="true" />
                          </button>
                        </div>
                      )}
                      <p 
                        className={styles.reviews__rating}
                        aria-label={`Рейтинг: ${review.rating} из 5`}
                      >
                        Рейтинг: {review.rating}
                      </p>
                    </div>
                  </div>
                  <p className={styles.reviews__comment}>
                    {review.comment}
                  </p>
                  <time 
                    className={styles.reviews__date}
                    dateTime={review.created_at}
                  >
                    {new Date(review.created_at).toLocaleDateString()}
                  </time>
                </article>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">Отзывов пока нет</p>
      )}
      {!editingReviewId && (
        <form
          onSubmit={handleReviewSubmit}
          className={styles.reviews__form}
          aria-labelledby="new-review-title"
        >
          <h3 id="new-review-title" className={styles.reviews__formTitle}>Оставить отзыв</h3>
          <div className={styles.reviews__group}>
            <label className={styles.reviews__label} htmlFor="rating">
              Рейтинг:
            </label>
            <select
              className={styles.reviews__select}
              id="rating"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
              aria-label="Выберите рейтинг"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} {`${"★".repeat(value)}${" ☆".repeat(5-value)}`}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.reviews__group}>
            <label className={styles.reviews__label} htmlFor="comment">
              Комментарий:
            </label>
            <textarea
              className={styles.reviews__textarea}
              id="comment"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              placeholder="Ваш отзыв..."
              aria-label="Введите текст отзыва"
            />
          </div>
          <button 
            type="submit" 
            className={styles.reviews__button}
            disabled={!isAuthenticated}
            aria-label={isAuthenticated ? "Отправить отзыв" : "Войдите, чтобы оставить отзыв"}
          >
            Отправить
          </button>
        </form>
      )}
    </section>
  );
}
