import { useEffect, useState } from "react";
import { randomReview } from "../../utils/api";
import styles from "./ReviewsList.module.scss";
import { PuffLoader } from "react-spinners";

export default function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await randomReview();
        setReviews(data.reviews);
        setTotalReviews(data.total_reviews);
      } catch (err) {
        setError(err.message || "Ошибка загрузки отзывов");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <PuffLoader color="#3E549D" size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <section className={styles.reviewsList}>
      <div className="container">
        <div className={styles.reviewsList__wrapper}>
            <h2 className={styles.reviewsList__title}>
                Отзывы <span className={styles.reviewsList__count}>{totalReviews}</span>
            </h2>
            <ul className={styles.reviewsList__content}>
                {reviews.map((review) => (
                    <li className={styles.reviewsList__item} key={review.id}>
                        <div className={styles.reviewsList__topWrapper}>
                            <p className={styles.reviewsList__user}>{review.user}</p>
                            <p className={styles.reviewsList__rating}>Рейтинг: {review.rating}</p>
                        </div>
                        <p className={styles.reviewsList__comment}>{review.comment}</p>
                        <time dateTime={review.created_at} className={styles.reviewsList__time}>{new Date(review.created_at).toLocaleDateString()}</time>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </section>
  );
}
