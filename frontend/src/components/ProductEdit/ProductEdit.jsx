import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, createProduct, updateProduct, deleteProduct, getCategories } from '../../utils/api';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { showToast } from '../../utils/toast';
import styles from './ProductEdit.module.scss';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [product, setProduct] = useState({
    name: '',
    description: '',
    brand: '',
    price: '',
    discount_percentage: 0,
    is_active: true,
    is_recommended: false,
    image: null,
    categories: [],
  });
  const [currentImage, setCurrentImage] = useState(null); 
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Category fetch error:', err);
        showToast('Ошибка загрузки категорий', 'error');
      }
    };

    fetchCategories();

    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const data = await getProduct(id);
          setProduct({
            name: data.name,
            description: data.description,
            brand: data.brand,
            price: data.price,
            discount_percentage: data.discount_percentage,
            is_active: data.is_active,
            is_recommended: data.is_recommended,
            image: null,
            categories: data.categories.map(cat => cat.id),
          });
          setCurrentImage(data.image); 
          setLoading(false);
        } catch (err) {
          console.error(err);
          showToast('Ошибка загрузки продукта', 'error');
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setProduct({ ...product, [name]: checked });
    } else if (type === 'file') {
      setProduct({ ...product, [name]: files[0] });
      setCurrentImage(files[0] ? URL.createObjectURL(files[0]) : null); 
    } else {
      setProduct({ ...product, [name]: value });
    }
  };

  const handleCategoryChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(parseInt(options[i].value));
      }
    }
    setProduct({ ...product, categories: selected });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('brand', product.brand);
    formData.append('price', product.price);
    formData.append('discount_percentage', product.discount_percentage);
    formData.append('is_active', product.is_active);
    formData.append('is_recommended', product.is_recommended);
    if (product.image) {
      formData.append('image', product.image);
    }
  product.categories.forEach(catId => {
    formData.append('categories', catId);
    console.log(`Appending category: ${catId}`);
  });

    try {
      if (isEditMode) {
        await updateProduct(id, formData);
        showToast('Продукт обновлен', 'success');
        navigate(`/products/${id}`);
      } else {
        await createProduct(formData);
        showToast('Продукт создан', 'success');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      showToast('Ошибка сохранения продукта', 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      try {
        await deleteProduct(id);
        showToast('Продукт удален', 'success');
        navigate(`/`);
      } catch (err) {
        console.error(err);
        showToast('Ошибка удаления продукта', 'error');
      }
    }
  };

  if (loading) return <div className={styles.productEdit__loading}>Загрузка...</div>;
  if (categories.length === 0) return <div className={styles.productEdit__loading}>Нет доступных категорий</div>;

  return (
    <>
      <Header />
      <main className={styles.productEdit}>
        <div className={styles.productEdit__header}>
          <h1 className={styles.productEdit__title}>
            {isEditMode ? 'Редактировать продукт' : 'Создать продукт'}
          </h1>
          <div className={styles.productEdit__actions}>
            {isEditMode && (
              <button
                onClick={handleDelete}
                className={styles.productEdit__deleteButton}
              >
                Удалить
              </button>
            )}
            <button
              onClick={() => navigate('/product/edit')}
              className={styles.productEdit__createButton}
            >
              Создать новый
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className={styles.productEdit__form}>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Название</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              className={styles.productEdit__input}
              required
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Описание</label>
            <textarea
              name="description"
              value={product.description}
              onChange={handleChange}
              className={styles.productEdit__textarea}
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Бренд</label>
            <input
              type="text"
              name="brand"
              value={product.brand}
              onChange={handleChange}
              className={styles.productEdit__input}
              required
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Цена</label>
            <input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              className={styles.productEdit__input}
              required
              min="0"
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Процент скидки</label>
            <input
              type="number"
              name="discount_percentage"
              value={product.discount_percentage}
              onChange={handleChange}
              className={styles.productEdit__input}
              min="0"
              max="100"
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Активен</label>
            <div className={styles.productEdit__checkboxWrapper}>
              <input
                type="checkbox"
                name="is_active"
                checked={product.is_active}
                onChange={handleChange}
                className={styles.productEdit__checkbox}
              />
              <span>Активен</span>
            </div>
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Рекомендован</label>
            <div className={styles.productEdit__checkboxWrapper}>
              <input
                type="checkbox"
                name="is_recommended"
                checked={product.is_recommended}
                onChange={handleChange}
                className={styles.productEdit__checkbox}
              />
              <span>Рекомендован</span>
            </div>
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Изображение</label>
            {currentImage && (
              <div className={styles.productEdit__imagePreview}>
                <img
                  src={currentImage}
                  alt="Текущее изображение продукта"
                  className={styles.productEdit__image}
                />
              </div>
            )}
            <input
              type="file"
              name="image"
              onChange={handleChange}
              className={styles.productEdit__fileInput}
              accept="image/*"
            />
          </div>
          <div className={styles.productEdit__field}>
            <label className={styles.productEdit__label}>Категории</label>
            <select
              multiple
              name="categories"
              value={product.categories}
              onChange={handleCategoryChange}
              className={styles.productEdit__select}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.path || cat.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className={styles.productEdit__submitButton}
          >
            Сохранить
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
};

export default ProductEdit;