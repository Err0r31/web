from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils.text import slugify

class ActiveOrderManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status__in=['pending', 'processing', 'shipped'])

class ActiveProductManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

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
    slug = models.SlugField(max_length=100, unique=True, verbose_name='Слаг', blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
        verbose_name='Родительская категория'
    )
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def get_path(self):
        if self.parent:
            return f"{self.parent.get_path()}/{self.name}"
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        unique_together = ('name', 'parent')

class Banner(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    title = models.CharField(max_length=200, verbose_name='Название')
    description = models.TextField(verbose_name='Описание', blank=True)
    is_active = models.BooleanField(default=False, verbose_name='Активна')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    image = models.ImageField(upload_to='banner/', blank=True, null=True, verbose_name='Изображение')
    link = models.URLField(max_length=200, blank=True, null=True, verbose_name='Ссылка для перехода')

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = 'Баннер'
        verbose_name_plural = 'Баннеры'
        ordering = ['-created_at']

class ProductCategory(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='product_categories')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='category_products')
    added_at = models.DateTimeField(default=timezone.now, verbose_name='Дата добавления')

    class Meta:
        verbose_name = 'Связь продукт-категория'
        verbose_name_plural = 'Связи продукт-категория'
        unique_together = ('product', 'category')

    def __str__(self):
        return f"{self.product.name} в {self.category.name}"

class Product(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=200, verbose_name='Название', blank=True)
    description = models.TextField(verbose_name='Описание', blank=True)
    brand = models.CharField(max_length=100, verbose_name='Бренд')
    price = models.IntegerField(verbose_name='Цена (в рублях)')
    discount_percentage = models.PositiveIntegerField(default=0, verbose_name='Процент скидки')
    categories = models.ManyToManyField(Category, through='ProductCategory', related_name='products', verbose_name='Категории')
    image = models.ImageField(upload_to='products/', blank=True, null=True, verbose_name='Изображение')
    is_active = models.BooleanField(default=False, verbose_name='Активен')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    is_recommended = models.BooleanField(default=False, verbose_name='Рекомендован')
    total_price = models.IntegerField(default=0, verbose_name='Итоговая цена', editable=False)

    objects = models.Manager()
    active_objects = ActiveProductManager()

    def clean(self):
        if self.discount_percentage < 0 or self.discount_percentage > 100:
            raise ValidationError('Процент скидки должен быть от 0 до 100.')

    def get_final_price(self):
        discount_amount = (self.price * self.discount_percentage) // 100
        return self.price - discount_amount

    def save(self, *args, **kwargs):
        self.clean()
        self.total_price = self.get_final_price()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('product-detail', kwargs={'pk': self.pk})

    def __str__(self):
        return self.name or f"Продукт {self.id}"

    class Meta:
        verbose_name = 'Продукт'
        verbose_name_plural = 'Продукты'
        ordering = ['name']

class ProductVariation(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variations', verbose_name='Продукт')
    size = models.CharField(max_length=10, verbose_name='Размер')
    color = models.CharField(max_length=50, verbose_name='Цвет')
    available_stock = models.PositiveIntegerField(default=0, verbose_name='Количество на складе', blank=True)
    reserved_quantity = models.PositiveIntegerField(default=0, verbose_name='Зарезервировано', blank=True)
    sold_quantity = models.PositiveIntegerField(default=0, verbose_name='Продано', blank=True)
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    images = models.ImageField(upload_to='product_variations/', blank=True, null=True, verbose_name='Изображение вариации')
    stock = models.PositiveIntegerField(default=0, editable=False, verbose_name='Доступный запас')

    def save(self, *args, **kwargs):
        self.available_stock = self.available_stock or 0
        self.reserved_quantity = self.reserved_quantity or 0
        self.stock = self.available_stock - self.reserved_quantity
        super().save(*args, **kwargs)

    def is_available(self, quantity=1):
        return (self.stock or 0) >= quantity

    def reserve_stock(self, quantity):
        if not self.is_available(quantity):
            raise ValidationError(f'Недостаточно запаса для {self}.')
        self.reserved_quantity += quantity
        self.save()

    def confirm_sale(self, quantity):
        if self.reserved_quantity < quantity:
            raise ValidationError(f'Нельзя подтвердить больше, чем зарезервировано для {self}.')
        self.reserved_quantity -= quantity
        self.sold_quantity += quantity
        self.save()

    def cancel_reservation(self, quantity):
        if self.reserved_quantity < quantity:
            raise ValidationError(f'Нельзя отменить больше, чем зарезервировано для {self}.')
        self.reserved_quantity -= quantity
        self.save()

    def __str__(self):
        return f"{self.product.name} - {self.size} - {self.color} (Доступно: {self.stock})"

    class Meta:
        verbose_name = 'Вариация продукта'
        verbose_name_plural = 'Вариации продуктов'
        unique_together = ('product', 'size', 'color')

class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Ожидает'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменён'),
    )

    id = models.AutoField(primary_key=True, verbose_name='ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Пользователь')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    order_date = models.DateTimeField(default=timezone.now, verbose_name='Дата заказа')
    discount_amount = models.IntegerField(default=0, verbose_name='Сумма скидки', editable=False)
    original_price = models.IntegerField(default=0, verbose_name='Цена без скидки', editable=False)
    total_price = models.IntegerField(default=0, verbose_name='Итоговая цена', editable=False)
    order_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='Номер заказа')
    invoice = models.FileField(upload_to='invoices/', blank=True, null=True, verbose_name='Счет (PDF)')

    objects = models.Manager()
    active_orders = ActiveOrderManager()

    def calculate_prices(self):
        self.original_price = sum(item.price * item.quantity for item in self.items.all())
        self.total_price = sum(item.variation.product.total_price * item.quantity for item in self.items.all())
        self.discount_amount = self.original_price - self.total_price

    def save(self, *args, **kwargs):
        if not self.pk:
            super().save(*args, **kwargs)
        self.calculate_prices()
        super().save(*args, **kwargs)

    def confirm_delivery(self):
        if self.status != 'shipped':
            raise ValidationError('Заказ должен быть в статусе "Отправлен" для подтверждения доставки.')
        for item in self.items.all():
            item.variation.confirm_sale(item.quantity)
        self.status = 'delivered'
        self.save()

    def cancel_order(self):
        if self.status in ['delivered', 'cancelled']:
            raise ValidationError('Нельзя отменить доставленный или уже отменённый заказ.')
        for item in self.items.all():
            item.variation.cancel_reservation(item.quantity)
        self.status = 'cancelled'
        self.save()

    def __str__(self):
        return f"Заказ {self.order_number} от {self.user.username}"

    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-order_date']

class OrderItem(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name='Заказ')
    variation = models.ForeignKey(ProductVariation, on_delete=models.CASCADE, verbose_name='Вариация продукта')
    price = models.IntegerField(verbose_name='Цена за единицу')
    quantity = models.PositiveIntegerField(verbose_name='Количество')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def clean(self):
        if not self.variation.is_available(self.quantity):
            raise ValidationError(f'Недостаточно запаса для {self.variation}.')

    def save(self, *args, **kwargs):
        self.clean()
        if not self.pk:
            if not self.variation or not self.variation.product:
                raise ValidationError("Вариация или продукт не указаны.")
            self.variation.reserve_stock(self.quantity)
            self.price = self.variation.product.price
        super().save(*args, **kwargs)
        self.order.save()

    def delete(self, *args, **kwargs):
        if self.pk:
            self.variation.cancel_reservation(self.quantity)
        super().delete(*args, **kwargs)
        self.order.save()

    def __str__(self):
        return f"{self.variation} x {self.quantity} в заказе {self.order.order_number}"

    class Meta:
        verbose_name = 'Элемент заказа'
        verbose_name_plural = 'Элементы заказа'

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveIntegerField(default=5)
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Отзыв от {self.user.username} для {self.product.name}"

    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'user']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'