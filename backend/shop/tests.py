from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from .models import User, Category, Product, ProductVariation, Cart, Order, OrderItem, Review, ProductColorImage

class ShopModelTests(TestCase):
    def setUp(self) -> None:
        """
        Создаёт базовые объекты для тестов: пользователя, категорию, продукт, вариацию и изображение цвета.
        """
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.category = Category(name='Одежда', gender='male')
        self.category.slug = slugify(self.category.name)
        self.category.save()
        self.product = Product.objects.create(
            name='Футболка', brand='Nike', price=2000, discount_percentage=10, is_active=True
        )
        self.product.categories.add(self.category)
        self.color = '#ffffff'
        self.color_image = ProductColorImage.objects.create(product=self.product, color=self.color, image='test.jpg')
        self.variation = ProductVariation.objects.create(
            product=self.product, size='M', color=self.color, available_stock=10
        )

    def test_user_creation(self) -> None:
        """
        Проверяет создание пользователя и его строковое представление.
        """
        self.assertEqual(str(self.user), 'testuser')
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_category_is_leaf(self) -> None:
        """
        Проверяет, что категория без подкатегорий является листом.
        """
        self.assertTrue(self.category.is_leaf())
        subcat = Category.objects.create(name='Футболки1', parent=self.category, gender='male', slug=slugify('Футболки1'))
        self.assertFalse(self.category.is_leaf())
        self.assertTrue(subcat.is_leaf())

    def test_product_final_price_and_total_price(self) -> None:
        """
        Проверяет корректность расчёта итоговой цены продукта с учётом скидки.
        """
        self.product.refresh_from_db()
        self.assertEqual(self.product.get_final_price(), 1800)
        self.assertEqual(self.product.total_price, 1800)

    def test_product_discount_validation(self) -> None:
        """
        Проверяет, что невалидный процент скидки вызывает ошибку.
        """
        self.product.discount_percentage = 150
        with self.assertRaises(ValidationError):
            self.product.full_clean()

    def test_variation_is_available(self) -> None:
        """
        Проверяет, что метод is_available возвращает True/False в зависимости от запаса.
        """
        self.assertTrue(self.variation.is_available(5))
        self.assertFalse(self.variation.is_available(20))

    def test_cart_total_price(self) -> None:
        """
        Проверяет корректность расчёта суммы корзины.
        """
        cart = Cart.objects.create(user=self.user)
        cart.items.create(variation=self.variation, quantity=2)
        self.assertEqual(cart.get_total_price(), 1800 * 2)

    def test_order_creation_and_price_calculation(self) -> None:
        """
        Проверяет создание заказа и корректность расчёта итоговой суммы.
        """
        order = Order.objects.create(user=self.user)
        OrderItem.objects.create(order=order, variation=self.variation, price=1800, quantity=2)
        order.save()
        order.refresh_from_db()
        self.assertEqual(order.total_price, 1800 * 2)
        self.assertEqual(order.original_price, 2000 * 2)
        self.assertEqual(order.discount_amount, 400)

    def test_review_unique_per_user_product(self) -> None:
        """
        Проверяет, что нельзя создать два отзыва от одного пользователя на один продукт.
        """
        review1 = Review.objects.create(product=self.product, user=self.user, rating=5, comment='Nice!')
        with self.assertRaises(Exception):
            Review.objects.create(product=self.product, user=self.user, rating=4, comment='Another!')
        self.assertEqual(str(review1), f"Отзыв от {self.user.username} для {self.product.name}")

    def test_category_get_descendants_ids(self) -> None:
        """
        Проверяет, что get_descendants_ids возвращает id всех потомков и себя.
        """
        subcat = Category.objects.create(name='Футболки2', parent=self.category, gender='male', slug=slugify('Футболки2'))
        subsubcat = Category.objects.create(name='Белые', parent=subcat, gender='male', slug=slugify('Белые') + '-unique')
        ids = self.category.get_descendants_ids()
        self.assertIn(self.category.id, ids)
        self.assertIn(subcat.id, ids)
        self.assertIn(subsubcat.id, ids)

    def test_product_str_method(self) -> None:
        """
        Проверяет, что метод __str__ у Product возвращает имя продукта, если оно есть, иначе 'Продукт <id>'.
        """
        self.assertEqual(str(self.product), 'Футболка')
        product2 = Product.objects.create(brand='Adidas', price=1000, discount_percentage=0, is_active=True)
        self.assertEqual(str(product2), f'Продукт {product2.id}')
