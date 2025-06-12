import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { PuffLoader } from "react-spinners";
import { getProduct } from "../../utils/api";
import { useToast } from "../../components/shared/Toast/ToastProvider";
import { AuthContext } from "../../context/AuthContext";
import styles from "./ProductPage.module.scss";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Reviews from "../../components/Reviews/Reviews";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariation, setSelectedVariation] = useState(null);
  const sliderRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProduct(id);
        setProduct(data);

        if (data.variations?.length > 0) {
          const firstVariation = data.variations[0];
          setSelectedColor(firstVariation.color);
          setSelectedSize(firstVariation.size);
          setSelectedVariation(firstVariation);
        }
      } catch (err) {
        setError(err.message || "Ошибка загрузки товара");
        showToast("Ошибка загрузки товара", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [id, showToast]);

  useEffect(() => {
    if (product?.variations) {
      const variation = product.variations.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
      setSelectedVariation(variation || null);
    }
  }, [selectedColor, selectedSize, product]);

  const availableColors = [
    ...new Set(product?.variations?.map((v) => v.color) || []),
  ];
  const availableSizes = [
    ...new Set(
      product?.variations
        ?.filter((v) => v.color === selectedColor)
        .map((v) => v.size) || []
    ),
  ];

  const colorImages =
    product?.color_images?.filter((img) => img.color === selectedColor) || [];

  const sliderSettings = {
    dots: true,
    infinite: true,
    lazyLoad: "ondemand",
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000,
    fade: true,
    pauseOnHover: true,
    arrows: false, 
    variableWidth: false, // Фиксированная ширина слайдов
    centerMode: false,
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading} role="status" aria-live="polite">
          <PuffLoader color="#3E549D" size={60} />
        </div>
      </div>
    );
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

  if (!product) {
    return (
      <div className="container">
        <div className={styles.error} role="alert">
          Товар не найден!
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="content" id="main-content">
        <div className="container">
          <div className={styles.product}>
            <div 
              className={styles.product__slider}
              role="region"
              aria-label="Галерея изображений товара"
            >
              {colorImages.length > 0 ? (
                <Slider {...sliderSettings} ref={sliderRef}>
                  {colorImages.map((img, index) => (
                    <div 
                      className={styles.product__sliderItem} 
                      key={`${img.id}-${index}`}
                      role="group"
                      aria-roledescription="слайд"
                      aria-label={`${index + 1} из ${colorImages.length}`}
                    >
                      <img
                        src={img.image}
                        alt={`${product.name} ${img.color}`}
                        className={styles.product__image}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </Slider>
              ) : product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className={styles.product__image}
                  loading="lazy"
                />
              ) : (
                <div className={styles.product__placeholder} aria-hidden="true">
                  Изображение отсутствует
                </div>
              )}
            </div>
            <div className={styles.product__leftSide}>
              <div className={styles.product__details}>
                <div className={styles.product__textWrapper}>
                  <p 
                    className={styles.product__rating}
                    aria-label={`Рейтинг товара: ${product.avg_rating?.toFixed(1) || 0} из 5`}
                  >
                    Рейтинг: {product.avg_rating?.toFixed(1) || 0}
                  </p>
                  <h1 className={styles.product__title}>{product.name}</h1>
                  <p className={styles.product__brand}>{product.brand}</p>
                </div>
                <p 
                  className={styles.product__price}
                  aria-label={`Цена: ${product.total_price} рублей`}
                >
                  {product.total_price} ₽
                </p>
              </div>
              <div 
                className={styles.variations}
                role="group"
                aria-label="Выбор цвета и размера"
              >
                <div 
                  className={styles.variations__group}
                  role="radiogroup"
                  aria-label="Выбор цвета"
                >
                  <p className={styles.variations__title} id="color-label">Цвет:</p>
                  <div 
                    className={styles.variations__selector}
                    aria-labelledby="color-label"
                  >
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        className={`${styles.variations__colorButton} ${
                          selectedColor === color
                            ? styles.variations__colorButtonActive
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                        aria-label={`Цвет: ${color}`}
                        aria-pressed={selectedColor === color}
                        role="radio"
                        aria-checked={selectedColor === color}
                      />
                    ))}
                  </div>
                </div>
                <div 
                  className={styles.variations__group}
                  role="radiogroup"
                  aria-label="Выбор размера"
                >
                  <p className={styles.variations__title} id="size-label">Размер:</p>
                  <div 
                    className={styles.variations__selector}
                    aria-labelledby="size-label"
                  >
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`${styles.variations__sizeButton} ${
                          selectedSize === size
                            ? styles.variations__sizeButtonActive
                            : ""
                        }`}
                        aria-label={`Размер: ${size}`}
                        aria-pressed={selectedSize === size}
                        role="radio"
                        aria-checked={selectedSize === size}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                className={styles.product__button}
                disabled={!selectedVariation || selectedVariation.stock === 0}
                aria-label={
                  !selectedVariation 
                    ? "Выберите цвет и размер" 
                    : selectedVariation.stock === 0 
                      ? "Нет в наличии" 
                      : `Добавить ${product.name} в корзину`
                }
              >
                {!selectedVariation || selectedVariation.stock === 0 
                  ? "Нет в наличии" 
                  : "Добавить в корзину"
                }
              </button>
            </div>
            <div 
              className={styles.product__descriptionWrapper}
              role="region"
              aria-label="Описание товара"
            >
              <h2 className={styles.product__subtitle}>Подробнее о товаре</h2>
              <div className={styles.product__description}>
                {product.description}
              </div>
            </div>
            <Reviews productId={id} reviews={product.reviews} setProduct={setProduct} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
