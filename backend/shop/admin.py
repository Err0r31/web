from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Banner, Product, ProductVariation, Order, OrderItem, Review, ProductCategory, ProductColorImage, CartItem, Cart
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from django import forms
from django.core.exceptions import ValidationError
from typing import Any, Optional


class ProductColorImageInline(admin.TabularInline):
    model = ProductColorImage
    extra = 1
    readonly_fields = ['created_at', 'color_preview']
    fields = ['color', 'color_preview', 'image', 'created_at']

    def color_preview(self, obj: ProductColorImage) -> str:
        """
        Возвращает HTML-превью цвета.
        Args:
            obj: объект ProductColorImage
        Returns:
            str: HTML-код превью
        """
        if obj.color:
            return format_html(
                '<div style="width: 30px; height: 30px; background-color: {}; border: 1px solid #000;"></div>',
                obj.color
            )
        return "-"
    color_preview.short_description = 'Превью цвета'

    def get_queryset(self, request: Any) -> Any:
        """
        Возвращает QuerySet только с изображениями, у которых есть продукт.
        Args:
            request: объект запроса
        Returns:
            QuerySet
        """
        qs = super().get_queryset(request)
        return qs.filter(product__id__isnull=False)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ['variation']
    readonly_fields = ['created_at', 'price_display']
    fields = ['variation', 'quantity', 'price_display', 'created_at']

    def get_readonly_fields(self, request: Any, obj: Optional[Any] = None) -> list:
        """
        Возвращает список только для чтения полей.
        Args:
            request: объект запроса
            obj: объект заказа
        Returns:
            list: список полей
        """
        if obj:
            return self.readonly_fields + ['variation', 'quantity']
        return self.readonly_fields

    def formfield_for_foreignkey(self, db_field: Any, request: Any, **kwargs: Any) -> Any:
        """
        Ограничивает выбор вариаций только теми, у которых есть запас.
        Args:
            db_field: поле foreign key
            request: объект запроса
        Returns:
            formfield
        """
        if db_field.name == 'variation':
            kwargs['queryset'] = ProductVariation.objects.filter(stock__gte=1)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def price_display(self, obj: OrderItem) -> Any:
        """
        Возвращает цену за единицу для OrderItem.
        Args:
            obj: OrderItem
        Returns:
            цена или строка
        """
        if obj.variation and not obj.price:
            return obj.variation.product.price
        return obj.price or "Не установлено"

    price_display.short_description = "Цена за единицу"

class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    readonly_fields = ['created_at', 'stock']
    fields = ['size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'stock', 'created_at']

    def color_preview(self, obj: ProductVariation) -> str:
        """
        Возвращает HTML-превью цвета вариации.
        Args:
            obj: ProductVariation
        Returns:
            str: HTML-код превью
        """
        if obj.color:
            return format_html(
                '<div style="width: 30px; height: 30px; background-color: {}; border: 1px solid #000;"></div>',
                obj.color
            )
        return "-"
    color_preview.short_description = 'Превью цвета'

    def get_queryset(self, request: Any) -> Any:
        """
        Возвращает QuerySet только с вариациями, у которых есть продукт.
        Args:
            request: объект запроса
        Returns:
            QuerySet
        """
        qs = super().get_queryset(request)
        return qs.filter(product__id__isnull=False)

class ProductCategoryInline(admin.TabularInline):
    model = ProductCategory
    extra = 1
    raw_id_fields = ['category']
    readonly_fields = ['added_at']
    fields = ['category', 'added_at']

    def get_queryset(self, request: Any) -> Any:
        """
        Возвращает QuerySet только с категориями, у которых есть продукт.
        Args:
            request: объект запроса
        Returns:
            QuerySet
        """
        qs = super().get_queryset(request)
        return qs.filter(product__id__isnull=False)

    def formfield_for_foreignkey(self, db_field: Any, request: Any, **kwargs: Any) -> Any:
        """
        Ограничивает выбор категорий всеми категориями.
        Args:
            db_field: поле foreign key
            request: объект запроса
        Returns:
            formfield
        """
        if db_field.name == 'category':
            kwargs['queryset'] = Category.objects.all()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'

    def clean(self) -> dict:
        """
        Проверяет валидность процента скидки.
        Returns:
            dict: очищенные данные
        Raises:
            ValidationError: если процент скидки вне диапазона 0-100
        """
        cleaned_data = super().clean()
        discount_percentage = cleaned_data.get('discount_percentage')
        if discount_percentage is not None and (discount_percentage < 0 or discount_percentage > 100):
            raise ValidationError('Процент скидки должен быть от 0 до 100.')
        return cleaned_data

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 1
    raw_id_fields = ['variation']
    readonly_fields = ['created_at', 'stock_display']
    fields = ['variation', 'quantity', 'stock_display', 'created_at']

    def stock_display(self, obj: CartItem) -> Any:
        """
        Возвращает доступный запас для CartItem.
        Args:
            obj: CartItem
        Returns:
            int или строка
        """
        return obj.variation.stock if obj.variation else "Н/Д"
    stock_display.short_description = "Доступный запас"

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'full_name', 'email', 'address', 'phone_number', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'groups']
    search_fields = ['username', 'full_name', 'email', 'address', 'phone_number']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['username', 'full_name', 'email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('full_name', 'email', 'address', 'phone_number')}),
        ('Права доступа', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Даты', {'fields': ('last_login', 'date_joined', 'created_at')}),
    )

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent_name', 'created_at']
    list_filter = ['parent', 'created_at']
    search_fields = ['name', 'parent__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['name']
    raw_id_fields = ['parent']
    prepopulated_fields = {'slug': ('name',)}

    @admin.display(description='Родительская категория')
    def parent_name(self, obj: Category) -> str:
        """
        Возвращает имя родительской категории.
        Args:
            obj: Category
        Returns:
            str: имя родителя или '-'
        """
        return obj.parent.name if obj.parent else '-'

@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_active', 'created_at', 'image_preview', 'link']
    list_filter = ['is_active']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'image_preview']
    list_display_links = ['title']
    fieldsets = (
        (None, {'fields': ('title', 'description', 'link')}),
        ('Изображение', {'fields': ('image',)}),
        ('Статус', {'fields': ('is_active',)}),
        ('Мета', {'fields': ('created_at',)}),
    )

    def image_preview(self, obj: Banner) -> str:
        """
        Возвращает превью изображения баннера.
        Args:
            obj: Banner
        Returns:
            str: HTML превью или 'Нет изображения'
        """
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "Нет изображения"
    image_preview.short_description = 'Превью изображения'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'brand', 'price', 'total_price', 'get_categories', 'is_active', 'is_recommended', 'discount_percentage', 'created_at']
    list_filter = ['is_active', 'is_recommended', 'brand', 'created_at']
    search_fields = ['name__icontains', 'description__contains', 'brand']
    readonly_fields = ['created_at', 'total_price']
    date_hierarchy = 'created_at'
    list_display_links = ['name']
    inlines = [ProductVariationInline, ProductColorImageInline, ProductCategoryInline]
    fieldsets = (
        (None, {'fields': ('name', 'description', 'brand', 'price')}),
        ('Изображения', {'fields': ('image',)}),
        ('Скидки и статус', {'fields': ('discount_percentage', 'is_active', 'is_recommended')}),
        ('Мета', {'fields': ('created_at', 'total_price')}),
    )

    def save_model(self, request: Any, obj: Product, form: Any, change: bool) -> None:
        """
        Сохраняет продукт из админки.
        Args:
            request: объект запроса
            obj: продукт
            form: форма
            change: изменяется ли существующий объект
        """
        obj.save()

    def save_related(self, request: Any, form: Any, formsets: Any, change: bool) -> None:
        """
        Сохраняет связанные объекты продукта (вариации, категории, изображения).
        Args:
            request: объект запроса
            form: форма
            formsets: связанные формы
            change: изменяется ли существующий объект
        """
        product = form.instance
        try:
            for formset in formsets:
                instances = formset.save(commit=False)
                for instance in instances:
                    if formset.model == ProductCategory and not instance.product_id:
                        instance.product = product
                    elif formset.model == ProductVariation and not instance.product_id:
                        instance.product = product
                    elif formset.model == ProductColorImage and not instance.product_id:
                        instance.product = product
                    instance.save()
                formset.save_m2m()
            variations = ProductVariation.objects.filter(product=product)
            for variation in variations:
                if not ProductColorImage.objects.filter(product=product, color=variation.color).exists():
                    self.message_user(request, f'Для цвета {variation.color} нет изображений. Добавьте изображение в ProductColorImage.', level='ERROR')
                    return 
            super().save_related(request, form, formsets, change)
        except ValidationError as e:
            self.message_user(request, f'Ошибка сохранения: {str(e)}', level='ERROR')

    def image_preview(self, obj: Product) -> str:
        """
        Возвращает превью изображения продукта.
        Args:
            obj: Product
        Returns:
            str: HTML превью или '-'
        """
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Превью"

    def get_categories(self, obj: Product) -> str:
        """
        Возвращает строку с названиями категорий продукта.
        Args:
            obj: Product
        Returns:
            str: строка категорий
        """
        return ", ".join([category.name for category in obj.categories.all()])
    get_categories.short_description = 'Категории'

@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'get_stock', 'created_at']
    list_filter = ['product', 'size', 'color']
    search_fields = ['product__name', 'size', 'color']
    readonly_fields = ['created_at', 'stock', 'color_preview']
    date_hierarchy = 'created_at'
    list_display_links = ['product_name']
    raw_id_fields = ['product']
    fields = ['product', 'size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'stock', 'created_at']

    def product_name(self, obj: ProductVariation) -> str:
        """
        Возвращает имя продукта вариации.
        Args:
            obj: ProductVariation
        Returns:
            str: имя продукта
        """
        return obj.product.name
    product_name.short_description = 'Продукт'

    def get_stock(self, obj: ProductVariation) -> int:
        """
        Возвращает доступный запас вариации.
        Args:
            obj: ProductVariation
        Returns:
            int: запас
        """
        return obj.stock
    get_stock.short_description = 'Доступный запас'

    def color_preview(self, obj: ProductVariation) -> str:
        """
        Возвращает превью цвета вариации.
        Args:
            obj: ProductVariation
        Returns:
            str: HTML превью
        """
        if obj.color:
            return format_html(
                '<div style="width: 30px; height: 30px; background-color: {}; border: 1px solid #000;"></div>',
                obj.color
            )
        return "-"
    color_preview.short_description = 'Превью цвета'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user_username', 'status', 'payment_method', 'get_original_price', 'get_total_price', 'discount_amount', 'order_date', 'is_valid_amount']
    list_filter = ['status', 'payment_method', 'order_date', 'user']
    search_fields = ['order_number', 'user__username', 'user__full_name']
    readonly_fields = ['order_number', 'order_date', 'original_price', 'total_price', 'discount_amount']
    date_hierarchy = 'order_date'
    list_display_links = ['order_number']
    inlines = [OrderItemInline]
    raw_id_fields = ['user']
    fields = ['user', 'status', 'payment_method', 'order_number', 'order_date', 'original_price', 'total_price', 'discount_amount']
    actions = ['generate_invoice_pdf']

    @admin.display(description='Пользователь')
    def user_username(self, obj: Order) -> str:
        """
        Возвращает имя пользователя заказа.
        Args:
            obj: Order
        Returns:
            str: имя пользователя или сообщение
        """
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.user.username

    @admin.display(description='Цена без скидки')
    def get_original_price(self, obj: Order) -> Any:
        """
        Возвращает цену без скидки заказа.
        Args:
            obj: Order
        Returns:
            цена или сообщение
        """
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.original_price

    @admin.display(description='Итоговая цена')
    def get_total_price(self, obj: Order) -> Any:
        """
        Возвращает итоговую цену заказа.
        Args:
            obj: Order
        Returns:
            цена или сообщение
        """
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.total_price

    @admin.display(description='Валидная сумма')
    def is_valid_amount(self, obj: Order) -> str:
        """
        Проверяет, валидна ли сумма заказа.
        Args:
            obj: Order
        Returns:
            str: 'Да' или 'Нет'
        """
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return "Да" if 500 <= obj.total_price <= 100000 else "Нет"
    is_valid_amount.short_description = 'Валидная сумма'

    @admin.action(description='Сгенерировать PDF-счет для выбранных заказов')
    def generate_invoice_pdf(self, request: Any, queryset: Any) -> HttpResponse:
        """
        Генерирует PDF-счёт для выбранных заказов.
        Args:
            request: объект запроса
            queryset: QuerySet заказов
        Returns:
            HttpResponse: PDF-файл
        """
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="invoices.pdf"'
        doc = SimpleDocTemplate(response, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        font_path = os.path.join(os.path.dirname(__file__), 'fonts', 'DejaVuSans.ttf')
        pdfmetrics.registerFont(TTFont('DejaVuSans', font_path))

        for order in queryset:
            data = [
                ['Заказ', str(order.order_number)],
                ['Пользователь', order.user.username],
                ['Дата', order.order_date.strftime('%Y-%m-%d %H:%M')],
                ['Статус', order.get_status_display()],
                ['Способ оплаты', order.get_payment_method_display()],
                ['Товары', ''],
                ['Название', 'Количество', 'Цена за единицу', 'Итого'],
            ]
            for item in order.items.all():
                data.append([
                    item.variation.product.name,
                    str(item.quantity),
                    str(item.price),
                    str(item.quantity * item.variation.product.total_price),
                ])
            data.append(['', '', 'Скидка:', str(order.discount_amount)])
            data.append(['', '', 'Итого:', str(order.total_price)])

            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 4), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 3), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 3), 12),
                ('BACKGROUND', (0, 5), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            styles['Heading1'].fontName = 'DejaVuSans'
            elements.append(Paragraph(f"Счет для заказа {order.order_number}", styles['Heading1']))
            elements.append(table)
            styles['Normal'].fontName = 'DejaVuSans'
            elements.append(Paragraph("", styles['Normal']))

        doc.build(elements)
        return response

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'variation', 'price', 'quantity', 'created_at']
    list_filter = ['order', 'variation__product']
    search_fields = ['order__order_number', 'variation__product__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['order', 'variation']

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'user_username', 'rating', 'comment', 'created_at', 'updated_at']
    list_filter = ['rating', 'created_at', 'product']
    search_fields = ['product__name', 'user__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_display_links = ['product_name']
    raw_id_fields = ['product', 'user']
    fields = ['product', 'user', 'rating', 'comment', 'created_at', 'updated_at']

    @admin.display(description='Продукт')
    def product_name(self, obj: Review) -> str:
        """
        Возвращает имя продукта для отзыва.
        Args:
            obj: Review
        Returns:
            str: имя продукта
        """
        return obj.product.name

    @admin.display(description='Пользователь')
    def user_username(self, obj: Review) -> str:
        """
        Возвращает имя пользователя для отзыва.
        Args:
            obj: Review
        Returns:
            str: имя пользователя
        """
        return obj.user.username
    
    @admin.display(description='Покупал товар')
    def has_purchased(self, obj: Review) -> str:
        """
        Проверяет, покупал ли пользователь товар.
        Args:
            obj: Review
        Returns:
            str: 'Да' или 'Нет'
        """
        return "Да" if Order.objects.filter(
            user=obj.user,
            status='delivered',
            items__variation__product=obj.product
        ).exists() else "Нет"
    has_purchased.short_description = 'Покупал товар'

    @admin.action(description='Проверить валидность отзывов')
    def check_purchase_validity(self, request: Any, queryset: Any) -> None:
        """
        Проверяет валидность отзывов (покупал ли пользователь товар).
        Args:
            request: объект запроса
            queryset: QuerySet отзывов
        """
        invalid_reviews = []
        for review in queryset:
            has_purchased = Order.objects.filter(
                user=review.user,
                status='delivered',
                items__variation__product=review.product
            ).exists()
            if not has_purchased:
                invalid_reviews.append(f"Отзыв {review.id} от {review.user.username} на {review.product.name}")
        if invalid_reviews:
            self.message_user(request, f"Найдены невалидные отзывы: {'; '.join(invalid_reviews)}")
        else:
            self.message_user(request, "Все выбранные отзывы валидны.")
    check_purchase_validity.short_description = 'Проверить валидность отзывов'

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'category', 'added_at']
    list_filter = ['category', 'added_at']
    search_fields = ['product__name', 'category__name']
    readonly_fields = ['added_at']
    date_hierarchy = 'added_at'

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user_username', 'created_at', 'item_count']
    list_filter = ['created_at', 'user']
    search_fields = ['user__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    inlines = [CartItemInline]
    raw_id_fields = ['user']

    @admin.display(description='Пользователь')
    def user_username(self, obj: Cart) -> str:
        """
        Возвращает имя пользователя корзины.
        Args:
            obj: Cart
        Returns:
            str: имя пользователя или 'Аноним'
        """
        return obj.user.username if obj.user else "Аноним"

    @admin.display(description='Количество товаров')
    def item_count(self, obj: Cart) -> int:
        """
        Возвращает количество товаров в корзине.
        Args:
            obj: Cart
        Returns:
            int: количество товаров
        """
        return obj.items.count()
    item_count.short_description = 'Количество товаров'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart_user', 'variation', 'quantity', 'stock_display', 'created_at']
    list_filter = ['created_at', 'variation__product']
    search_fields = ['cart__user__username', 'cart__session_key', 'variation__product__name']
    readonly_fields = ['created_at', 'stock_display']
    date_hierarchy = 'created_at'
    raw_id_fields = ['cart', 'variation']

    @admin.display(description='Пользователь')
    def cart_user(self, obj: CartItem) -> str:
        """
        Возвращает имя пользователя корзины или сессию.
        Args:
            obj: CartItem
        Returns:
            str: имя пользователя или сессия
        """
        return obj.cart.user.username if obj.cart.user else f"Сессия {obj.cart.session_key or 'без ключа'}"
    cart_user.short_description = 'Пользователь'

    @admin.display(description='Доступный запас')
    def stock_display(self, obj: CartItem) -> Any:
        """
        Возвращает доступный запас для CartItem.
        Args:
            obj: CartItem
        Returns:
            int или строка
        """
        return obj.variation.stock if obj.variation else "Н/Д"
    stock_display.short_description = 'Доступный запас'