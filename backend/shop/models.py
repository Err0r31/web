from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid

class User(AbstractUser):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    address = models.TextField(blank=True, null=True, verbose_name='Адрес')
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name='Номер телефона')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return self.username

    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

class Category(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=100, verbose_name='Название')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        verbose_name='Родительская категория'
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'

class Promo(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Процент скидки')
    start_date = models.DateTimeField(verbose_name='Дата начала')
    end_date = models.DateTimeField(verbose_name='Дата окончания')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Акция'
        verbose_name_plural = 'Акции'
        ordering = ['-start_date']

class ProductVariation(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        related_name='variations',
        verbose_name='Продукт'
    )
    size = models.CharField(max_length=10, verbose_name='Размер')
    color = models.CharField(max_length=50, verbose_name='Цвет')
    stock = models.PositiveIntegerField(verbose_name='Количество на складе')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return f"{self.product.name} - {self.size} - {self.color}"

    class Meta:
        verbose_name = 'Вариация продукта'
        verbose_name_plural = 'Вариации продуктов'
        unique_together = ('product', 'size', 'color')

class Product(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание')
    brand = models.CharField(max_length=100, verbose_name='Бренд')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    categories = models.ManyToManyField(
        Category,
        related_name='products',
        verbose_name='Категории'
    )
    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
        verbose_name='Изображение'
    )
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name='Процент скидки'
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Продукт'
        verbose_name_plural = 'Продукты'
        ordering = ['name']

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменён'),
    )

    id = models.AutoField(primary_key=True, verbose_name='ID')
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Пользователь'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    order_date = models.DateTimeField(default=timezone.now, verbose_name='Дата заказа')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Итоговая цена')
    original_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена без скидки')
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        verbose_name='Сумма скидки'
    )
    order_number = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='Номер заказа'
    )

    def __str__(self):
        return f"Заказ {self.order_number} от {self.user.username}"

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-order_date']

class OrderItem(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )
    variation = models.ForeignKey(
        ProductVariation,
        on_delete=models.CASCADE,
        verbose_name='Вариация продукта'
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    quantity = models.PositiveIntegerField(verbose_name='Количество')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def __str__(self):
        return f"{self.variation} x {self.quantity} в заказе {self.order.order_number}"

    class Meta:
        verbose_name = 'Элемент заказа'
        verbose_name_plural = 'Элементы заказа'