from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid
from django.core.exceptions import ValidationError
from decimal import Decimal

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
        unique_together = ('name', 'parent')

class Promo(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    title = models.CharField(max_length=200, verbose_name='Название', blank=False)
    description = models.TextField(verbose_name='Описание', blank=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Процент скидки', blank=True, null=True)
    start_date = models.DateTimeField(verbose_name='Дата начала', blank=True, null=True)
    end_date = models.DateTimeField(verbose_name='Дата окончания', blank=True, null=True)
    is_active = models.BooleanField(default=False, verbose_name='Активна')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    def clean(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError('Дата начала должна быть раньше даты окончания.')
        if self.discount_percentage is not None and (self.discount_percentage < 0 or self.discount_percentage > 100):
            raise ValidationError('Процент скидки должен быть от 0 до 100.')

    def is_currently_active(self):
        now = timezone.now()
        return self.is_active and self.start_date and self.end_date and self.start_date <= now <= self.end_date

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
    available_stock = models.PositiveIntegerField(default=0, verbose_name='Количество на складе', blank=True)
    reserved_quantity = models.PositiveIntegerField(default=0, verbose_name='Зарезервировано', blank=True)
    sold_quantity = models.PositiveIntegerField(default=0, verbose_name='Продано', blank=True)
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')

    @property
    def stock(self):
        """Доступный запас для продажи."""
        return self.available_stock - self.reserved_quantity

    def is_available(self, quantity=1):
        return self.stock >= quantity
    
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

class Product(models.Model):
    id = models.AutoField(primary_key=True, verbose_name='ID')
    name = models.CharField(max_length=200, verbose_name='Название', blank=True)
    description = models.TextField(verbose_name='Описание', blank=True)
    brand = models.CharField(max_length=100, verbose_name='Бренд', blank=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена', blank=False)
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
    is_active = models.BooleanField(default=False, verbose_name='Активен')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='Дата создания')
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        verbose_name='Процент скидки',
        blank=True,
        null=True
    )

    def clean(self):
        if self.discount_percentage is not None and (self.discount_percentage < 0 or self.discount_percentage > 100):
            raise ValidationError('Процент скидки должен быть от 0 до 100.')

    def get_final_price(self):
        """Возвращает цену с учетом скидки."""
        discount = self.discount_percentage or 0
        return self.price * (1 - discount / 100)

    def __str__(self):
        return self.name or f"Продукт {self.id}"

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
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        blank=False,
        verbose_name='Сумма скидки'
    )
    order_number = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='Номер заказа'
    )

    @property
    def original_price(self):
        """Цена без скидки на основе элементов заказа."""
        return sum(item.price * item.quantity for item in self.items.all()) or Decimal('0.00')

    @property
    def total_price(self):
        """Итоговая цена с учетом скидок."""
        return sum(item.variation.product.get_final_price() * item.quantity for item in self.items.all()) or Decimal('0.00')

    @property
    def calculated_discount_amount(self):
        """Рассчитанная сумма скидки."""
        return self.original_price - self.total_price

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.discount_amount = self.calculated_discount_amount
        super().save(update_fields=['discount_amount'])

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

    def clean(self):
        if not self.variation.is_available(self.quantity):
            raise ValidationError(f'Недостаточно запаса для {self.variation}.')

    def save(self, *args, **kwargs):
        self.clean()
        if not self.pk:
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