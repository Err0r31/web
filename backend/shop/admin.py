from django.contrib import admin
from django.utils.html import format_html
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Banner, Product, ProductVariation, Order, OrderItem, Outfit


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ['variation']
    readonly_fields = ['created_at', 'price']
    fields = ['variation', 'quantity', 'price', 'created_at']

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return self.readonly_fields + ['variation', 'quantity']
        return self.readonly_fields


class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    readonly_fields = ['created_at', 'stock']
    fields = ['size', 'color', 'available_stock', 'reserved_quantity', 'sold_quantity', 'stock', 'created_at']


class OutfitProductInline(admin.TabularInline):
    model = Outfit.products.through
    extra = 1
    raw_id_fields = ['product']
    verbose_name = 'Продукт в образе'
    verbose_name_plural = 'Продукты в образе'


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
        (None, {
            'fields': ('title', 'description', 'link')
        }),
        ('Изображение', {
            'fields': ('image',)
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
        ('Мета', {
            'fields': ('created_at',)
        }),
    )

    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.image.url)
        return "Нет изображения"
    image_preview.short_description = 'Превью изображения'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'price', 'total_price', 'get_categories', 'is_active', 'is_recommended', 'discount_percentage', 'created_at']
    list_filter = ['is_active', 'is_recommended', 'categories', 'brand', 'created_at']
    search_fields = ['name', 'description', 'brand', 'categories__name']
    readonly_fields = ['created_at', 'total_price']
    date_hierarchy = 'created_at'
    list_display_links = ['name']
    filter_horizontal = ['categories']
    inlines = [ProductVariationInline]
    fieldsets = (
        (None, {'fields': ('name', 'description', 'brand', 'price', 'categories')}),
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

    @admin.display(description='Пользователь')
    def user_username(self, obj):
        return obj.user.username

    @admin.display(description='Цена без скидки')
    def get_original_price(self, obj):
        return obj.original_price

    @admin.display(description='Итоговая цена')
    def get_total_price(self, obj):
        return obj.total_price


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'variation', 'price', 'quantity', 'created_at']
    list_filter = ['order', 'variation__product']
    search_fields = ['order__order_number', 'variation__product__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['order', 'variation']


@admin.register(Outfit)
class OutfitAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_products', 'total_price', 'created_at']
    list_filter = ['products', 'created_at']
    search_fields = ['name', 'products__name']
    readonly_fields = ['created_at', 'total_price']
    date_hierarchy = 'created_at'
    inlines = [OutfitProductInline]
    filter_horizontal = ['products']
    list_display_links = ['name']

    def get_products(self, obj):
        return ", ".join([product.name for product in obj.products.all()])
    get_products.short_description = 'Продукты'
