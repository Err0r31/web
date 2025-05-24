from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Banner, Product, ProductVariation, Order, OrderItem, Review, ProductCategory
from django.http import HttpResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ['variation']
    readonly_fields = ['created_at', 'price_display']
    fields = ['variation', 'quantity', 'price_display', 'created_at']

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['variation', 'quantity']
        return self.readonly_fields

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'variation':
            kwargs['queryset'] = ProductVariation.objects.filter(stock__gte=1)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def price_display(self, obj):
        if obj.variation and not obj.price:
            return obj.variation.product.price
        return obj.price or "Не установлено"

    price_display.short_description = "Цена за единицу"

class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    readonly_fields = ['created_at', 'stock']
    fields = ['size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'stock', 'created_at']

class ProductCategoryInline(admin.TabularInline):
    model = ProductCategory
    extra = 1
    raw_id_fields = ['category']
    readonly_fields = ['added_at']
    fields = ['category', 'added_at']

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'address', 'phone_number', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'groups']
    search_fields = ['username', 'email', 'address', 'phone_number']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['username', 'email']
    filter_horizontal = ['groups', 'user_permissions']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'email', 'address', 'phone_number')}),
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
    def parent_name(self, obj):
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

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "Нет изображения"
    image_preview.short_description = 'Превью изображения'

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'price', 'total_price', 'get_categories', 'is_active', 'is_recommended', 'discount_percentage', 'created_at']
    list_filter = ['is_active', 'is_recommended', 'brand', 'created_at']
    search_fields = ['name__icontains', 'description__contains', 'brand', 'categories__name']
    readonly_fields = ['created_at', 'total_price']
    date_hierarchy = 'created_at'
    list_display_links = ['name']
    inlines = [ProductVariationInline, ProductCategoryInline]
    fieldsets = (
        (None, {'fields': ('name', 'description', 'brand', 'price')}),
        ('Изображения', {'fields': ('image',)}),
        ('Скидки и статус', {'fields': ('discount_percentage', 'is_active', 'is_recommended')}),
        ('Мета', {'fields': ('created_at', 'total_price')}),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;" />', obj.image.url)
        return "-"
    image_preview.short_description = "Превью"

    @admin.display(description='Категории')
    def get_categories(self, obj):
        return ", ".join([category.name for category in obj.categories.all()])

@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'get_stock', 'created_at']
    list_filter = ['product', 'size', 'color']
    search_fields = ['product__name', 'size', 'color']
    readonly_fields = ['created_at', 'stock']
    date_hierarchy = 'created_at'
    list_display_links = ['product_name']
    raw_id_fields = ['product']
    fields = ['product', 'size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'stock', 'created_at']

    @admin.display(description='Продукт')
    def product_name(self, obj):
        return obj.product.name

    @admin.display(description='Доступный запас')
    def get_stock(self, obj):
        return obj.stock

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user_username', 'status', 'get_original_price', 'get_total_price', 'discount_amount', 'order_date']
    list_filter = ['status', 'order_date', 'user']
    search_fields = ['order_number', 'user__username']
    readonly_fields = ['order_number', 'order_date', 'original_price', 'total_price', 'discount_amount']
    date_hierarchy = 'order_date'
    list_display_links = ['order_number']
    inlines = [OrderItemInline]
    raw_id_fields = ['user']
    fields = ['user', 'status', 'order_number', 'order_date', 'original_price', 'total_price', 'discount_amount']
    actions = ['generate_invoice_pdf']

    @admin.display(description='Пользователь')
    def user_username(self, obj):
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.user.username

    @admin.display(description='Цена без скидки')
    def get_original_price(self, obj):
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.original_price

    @admin.display(description='Итоговая цена')
    def get_total_price(self, obj):
        if not obj.pk:
            return "Не рассчитано (сохраните заказ)"
        return obj.total_price

    @admin.action(description='Сгенерировать PDF-счет для выбранных заказов')
    def generate_invoice_pdf(self, request, queryset):
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
                ('BACKGROUND', (0, 0), (-1, 3), colors.grey),
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
    def product_name(self, obj):
        return obj.product.name

    @admin.display(description='Пользователь')
    def user_username(self, obj):
        return obj.user.username

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['product', 'category', 'added_at']
    list_filter = ['category', 'added_at']
    search_fields = ['product__name', 'category__name']
    readonly_fields = ['added_at']
    date_hierarchy = 'added_at'