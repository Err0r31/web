from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Promo, Product, ProductVariation, Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    raw_id_fields = ['variation']
    readonly_fields = ['created_at']

class ProductVariationInline(admin.TabularInline):
    model = ProductVariation
    extra = 1
    readonly_fields = ['created_at']

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

    @admin.display(description='Родительская категория')
    def parent_name(self, obj):
        return obj.parent.name if obj.parent else '-'

@admin.register(Promo)
class PromoAdmin(admin.ModelAdmin):
    list_display = ['title', 'discount_percentage', 'start_date', 'end_date', 'is_active', 'created_at']
    list_filter = ['is_active', 'start_date', 'end_date']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'start_date'
    list_display_links = ['title']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'price', 'get_categories', 'is_active', 'discount_percentage', 'created_at']
    list_filter = ['is_active', 'categories', 'brand', 'created_at']
    search_fields = ['name', 'description', 'brand', 'categories__name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['name']
    filter_horizontal = ['categories']
    inlines = [ProductVariationInline]
    raw_id_fields = ['categories']

    @admin.display(description='Категории')
    def get_categories(self, obj):
        return ", ".join([category.name for category in obj.categories.all()])

    get_categories.short_description = 'Категории'

@admin.register(ProductVariation)
class ProductVariationAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'size', 'color', 'stock', 'created_at']
    list_filter = ['product', 'size', 'color']
    search_fields = ['product__name', 'size', 'color']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['product_name']
    raw_id_fields = ['product']

    @admin.display(description='Продукт')
    def product_name(self, obj):
        return obj.product.name
    
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user_username', 'status', 'total_price', 'discount_amount', 'order_date']
    list_filter = ['status', 'order_date', 'user']
    search_fields = ['order_number', 'user__username']
    readonly_fields = ['order_number', 'order_date']
    date_hierarchy = 'order_date'
    list_display_links = ['order_number']
    inlines = [OrderItemInline]
    raw_id_fields = ['user']

    @admin.display(description='Пользователь')
    def user_username(self, obj):
        return obj.user.username
    
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'variation_display', 'price', 'quantity', 'created_at']
    list_filter = ['order', 'variation']
    search_fields = ['order__order_number', 'variation__product__name', 'variation__size', 'variation__color']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    list_display_links = ['order_number']
    raw_id_fields = ['order', 'variation']

    @admin.display(description='Номер заказа')
    def order_number(self, obj):
        return obj.order.order_number

    @admin.display(description='Вариация')
    def variation_display(self, obj):
        return str(obj.variation)