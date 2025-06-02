import React, { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import { BsArrowLeft, BsArrowRight } from "react-icons/bs";
import { getBanners } from "../../utils/api";
import { PuffLoader } from "react-spinners";
import styles from "./Banner.module.scss";

export default function Banner() {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [banners, setBanners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const data = await getBanners();
        setBanners(data);
      } catch (err) {
        setError(err.message || "Ошибка загрузки баннеров");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const settings = {
    dots: false,
    infinite: true,
    lazyLoad: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    fade: true,
    pauseOnHover: true,
    arrows: false,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className={styles.banner__loading} role="status" aria-live="polite">
          <PuffLoader color="#3E549D" size={60} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.banner__error} role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!banners || banners.length === 0) {
    return (
      <div className="container">
        <div className={styles.banner__loading} role="status">
          Баннеры не найдены!
        </div>
      </div>
    );
  }

  return (
    <section className={styles.banner} aria-label="Рекламные баннеры">
      <div className="container">
        <Slider {...settings} ref={sliderRef}>
          {banners.map((banner, index) => (
            <div 
              key={banner.id} 
              className={styles.banner__item}
              role="group"
              aria-roledescription="слайд"
              aria-label={`${index + 1} из ${banners.length}`}
            >
              {banner.image ? (
                <img
                  src={banner.image}
                  alt={banner.title}
                  loading="lazy"
                  className={styles.banner__img}
                />
              ) : (
                <div className={styles.banner__placeholder} aria-hidden="true">
                  Изображения нет
                </div>
              )}
              <div className={styles.banner__content}>
                <div className={styles.banner__contentLeft}>
                  <h2 className={styles.banner__title}>{banner.title}</h2>
                  <p className={styles.banner__description}>
                    {banner.description}
                  </p>
                  <Link 
                    to={banner.link} 
                    className={styles.banner__link}
                    aria-label={`Перейти к ${banner.title}`}
                  >
                    Перейти
                  </Link>
                </div>
                <div 
                  className={styles.banner__arrows}
                  role="group"
                  aria-label="Управление слайдером"
                >
                  <button
                    type="button"
                    className={styles.banner__customArrow}
                    onClick={() => sliderRef.current.slickPrev()}
                    aria-label="Предыдущий слайд"
                  >
                    <BsArrowLeft aria-hidden="true" />
                  </button>
                  <span 
                    className={styles.banner__slideCounter}
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {currentSlide + 1} / {banners.length}
                  </span>
                  <button
                    type="button"
                    className={styles.banner__customArrow}
                    onClick={() => sliderRef.current.slickNext()}
                    aria-label="Следующий слайд"
                  >
                    <BsArrowRight aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
}
