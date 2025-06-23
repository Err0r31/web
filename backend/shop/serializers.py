from rest_framework import serializers
from .models import Banner, Product, Order, Category, User, Review, ProductVariation, ProductColorImage, OrderItem, CartItem, Cart, Favorite, EDexam
import re
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from typing import Any, Optional

class CategorySerializer(serializers.ModelSerializer):
    path = serializers.SerializerMethodField()
    subcategories = serializers.SerializerMethodField()
    is_leaf = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'gender', 'parent', 'subcategories', 'is_leaf', 'path']

    def get_subcategories(self, obj: Category) -> list:
        """
        Возвращает сериализованные подкатегории.
        Args:
            obj: Объект категории
        Returns:
            list: Список подкатегорий
        """
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []

    def get_is_leaf(self, obj: Category) -> bool:
        """
        Проверяет, является ли категория листом.
        Args:
            obj: Объект категории
        Returns:
            bool: True если нет подкатегорий
        """
        return not obj.subcategories.exists()

    def get_path(self, obj: Category) -> str:
        """
        Возвращает путь категории.
        Args:
            obj: Объект категории
        Returns:
            str: путь
        """
        return obj.get_path()
    

class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    def validate_rating(self, value: int) -> int:
        """
        Проверяет, что рейтинг в диапазоне 1-5.
        Args:
            value: рейтинг
        Returns:
            int: рейтинг
        Raises:
            ValidationError: если рейтинг вне диапазона
        """
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Рейтинг должен быть от 1 до 5.")
        return value

    def validate(self, data: dict) -> dict:
        """
        Проверяет, что пользователь может оставить отзыв только если покупал товар и не оставлял отзыв ранее.
        Args:
            data: данные отзыва
        Returns:
            dict: данные отзыва
        Raises:
            ValidationError: если условия не выполнены
        """
        product = data.get('product')
        request = self.context.get('request')
        user = request.user

        if self.instance is None:
            if Review.objects.filter(product=product, user=user).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Вы уже оставили отзыв на этот продукт.'
                })

            has_purchased = Order.objects.filter(
                user=user, 
                status='delivered',
                items__variation__product=product
            ).exists()
            if not has_purchased:
                raise serializers.ValidationError({
                    'non_field_errors': 'Вы не можете оставить отзыв, так как не покупали данные товар.'
                })
        return data

    def validate_product(self, value: Product) -> Product:
        """
        Проверяет, что продукт существует.
        Args:
            value: продукт
        Returns:
            Product: продукт
        Raises:
            ValidationError: если продукт не найден
        """
        if not Product.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Продукт не существует.")
        return value

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'user_id', 'rating', 'comment', 'created_at', 'updated_at']


class ProductColorImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    def validate_color(self, value: str) -> str:
        """
        Проверяет, что цвет в формате HEX.
        Args:
            value: строка цвета
        Returns:
            str: цвет в нижнем регистре
        Raises:
            ValidationError: если цвет не HEX
        """
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise serializers.ValidationError('Цвет должен быть в формате HEX, например, #ffffff.')
        return value.lower()

    def to_representation(self, instance: ProductColorImage) -> dict:
        """
        Возвращает сериализованное представление изображения цвета.
        Args:
            instance: объект ProductColorImage
        Returns:
            dict: сериализованные данные
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and data['image']:
            data['image'] = request.build_absolute_uri(data['image'])
        return data

    class Meta:
        model = ProductColorImage
        fields = ['id', 'image', 'color', 'created_at']


class MinimalProductSerializer(serializers.ModelSerializer):

    def to_representation(self, instance: Product) -> dict:
        """
        Возвращает сериализованное представление продукта с абсолютным URL изображения.
        Args:
            instance: объект Product
        Returns:
            dict: сериализованные данные
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and data['image']:
            data['image'] = request.build_absolute_uri(data['image'])
        return data

    class Meta:
        model = Product
        fields = ['id', 'name', 'total_price', 'image', 'brand', 'discount_percentage', 'price']


class ProductVariationSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializer(read_only=True)

    def validate_color(self, value: str) -> str:
        """
        Проверяет, что цвет в формате HEX и есть изображение для цвета.
        Args:
            value: строка цвета
        Returns:
            str: цвет в нижнем регистре
        Raises:
            ValidationError: если цвет не HEX или нет изображения
        """
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise serializers.ValidationError('Цвет должен быть в формате HEX, например, #ffffff.')
        value = value.lower()
        product_id = self.initial_data.get('product')
        if product_id and not ProductColorImage.objects.filter(product_id=product_id, color=value).exists():
            raise serializers.ValidationError(f'Для цвета {value} нет изображений.')
        return value
    
    class Meta:
        model = ProductVariation
        fields = ['id', 'product', 'size', 'color', 'stock', 'available_stock', 'reserved_quantity', 'sold_quantity', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    last_category_name = serializers.SerializerMethodField()
    categories = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Category.objects.all(),
        required=True, 
        write_only=True
    )
    reviews = ReviewSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    color_images = ProductColorImageSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()
    sold_quantity = serializers.IntegerField(read_only=True, source='sold_quantity__sum')
    favorite_count = serializers.IntegerField(read_only=True, source='favorite_count__count')

    def get_last_category_name(self, obj: Product) -> str:
        """
        Возвращает название последней категории продукта.
        Args:
            obj: объект продукта
        Returns:
            str: название категории
        """
        last_category = obj.categories.last()
        return last_category.name if last_category else ""

    def get_is_favorited(self, obj: Product) -> bool:
        """
        Проверяет, добавлен ли продукт в избранное текущим пользователем.
        Args:
            obj: объект продукта
        Returns:
            bool: True если в избранном
        """
        user = self.context.get('request').user
        if user.is_authenticated:
            return Favorite.objects.filter(user=user, product=obj).exists()
        return False

    def to_representation(self, instance: Product) -> dict:
        """
        Возвращает сериализованное представление продукта с абсолютным URL изображения и категориями.
        Args:
            instance: объект Product
        Returns:
            dict: сериализованные данные
        """
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and data['image']:
            data['image'] = request.build_absolute_uri(data['image'])
        data['categories'] = CategorySerializer(instance.categories.all(), many=True).data
        return data

    def validate_image(self, value: Any) -> Any:
        """
        Проверяет, что файл изображения валиден.
        Args:
            value: файл изображения
        Returns:
            файл изображения
        Raises:
            ValidationError: если файл не изображение
        """
        if value:
            print(f"Received image: {value.name}, size: {value.size}, content_type: {value.content_type}")
            if not value.content_type.startswith('image/'):
                raise serializers.ValidationError("Загруженный файл не является изображением.")
        return value

    def validate(self, data: dict) -> dict:
        """
        Проверяет, что выбрана хотя бы одна категория.
        Args:
            data: данные продукта
        Returns:
            dict: данные продукта
        Raises:
            ValidationError: если не выбрана категория
        """
        print(f"Validated data: {data}") 
        if not data.get('categories'):
            raise serializers.ValidationError({'categories': 'Выберите хотя бы одну категорию.'})
        return data

    def create(self, validated_data: dict) -> Product:
        """
        Создаёт продукт и связывает с категориями.
        Args:
            validated_data: данные продукта
        Returns:
            Product: созданный продукт
        """
        categories_data = validated_data.pop('categories', [])
        product = Product.objects.create(**validated_data)
        if categories_data:
            product.categories.set(categories_data)
        return product

    def update(self, instance: Product, validated_data: dict) -> Product:
        """
        Обновляет продукт и его категории.
        Args:
            instance: продукт
            validated_data: новые данные
        Returns:
            Product: обновлённый продукт
        """
        categories_data = validated_data.pop('categories', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if categories_data is not None:
            instance.categories.set(categories_data)
        return instance


    class Meta:
        model = Product
        fields = '__all__'


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'description', 'is_active', 'image', 'link']


class CartItemSerializer(serializers.ModelSerializer):
    variation = ProductVariationSerializer(read_only=True)
    variation_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariation.objects.all(), source='variation', write_only=True, required=True,
    )
    product = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'variation_id', 'variation', 'quantity', 'product', 'total_price'] 

    def get_product(self, obj):
        request = self.context.get('request')
        product = obj.variation.product
        return {
            'id': product.id,
            'name': product.name,
            'image': request.build_absolute_uri(product.image.url) if request and product.image else None,
            'total_price': product.total_price,
            'discount_percentage': product.discount_percentage,
            'price': product.price,
            'brand': product.brand,
        }

    def get_total_price(self, obj):
        return obj.variation.product.total_price * obj.quantity

    def validate(self, data):
        variation = data.get('variation')
        quantity = data.get('quantity')
        if variation and quantity:
            if quantity > variation.stock:
                raise serializers.ValidationError({
                    'quantity': f'Недостаточно товара на складе. Доступно: {variation.stock}.'
                })
        return data


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.ReadOnlyField(source='get_total_price')

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price']


class OrderItemSerializer(serializers.ModelSerializer):
    variation = serializers.PrimaryKeyRelatedField(queryset=ProductVariation.objects.all())
    product_name = serializers.SerializerMethodField()
    color = serializers.SerializerMethodField()
    size = serializers.SerializerMethodField()

    def get_product_name(self, obj):
        return obj.variation.product.name
    def get_color(self, obj):
        return obj.variation.color
    def get_size(self, obj):
        return obj.variation.size

    def validate(self, data):
        variation = data['variation']
        quantity = data.get('quantity', 1)
        if not variation.is_available(quantity):
            raise serializers.ValidationError(
                f'Недостаточно товара {variation.product.name} ({variation.size}, {variation.color}) на складе. '
                f'Доступно: {variation.stock}'
            )
        return data
    
    class Meta:
        model = OrderItem
        fields = ['id', 'variation', 'product_name', 'color', 'size', 'quantity', 'price', 'created_at']
        read_only_fields = ['id']
        extra_kwargs = {
            'price': {'required': False},
        }


class OrderSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    items = OrderItemSerializer(many=True, required=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES, default='card')

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError('Заказ должен содержать минимум один товар.')
        return items

    def validate(self, data):
        items = data.get('items', [])
        total_price = sum(
            item['variation'].product.total_price * item.get('quantity', 1)
            for item in items
        )
        if total_price < 500:
            raise serializers.ValidationError(
                f"Сумма заказа должна быть не менее 500 рублей. Текущая сумма: {total_price} рублей."
            )
        if total_price > 100000:
            raise serializers.ValidationError(
                f"Сумма заказа не должна превышать 100,000 рублей. Текущая сумма: {total_price} рублей."
            )
        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        payment_method = validated_data.pop('payment_method', 'card')
        order = Order.objects.create(
            user=self.context['request'].user,
            payment_method=payment_method,
            **validated_data,
        )
        for item_data in items_data:
            OrderItem.objects.create(
                order=order,
                **item_data,
            )
        order.save()
        return order

    class Meta:
        model = Order
        fields = ['id', 'order_number', 'user', 'items', 'status', 'payment_method', 'total_price', 'order_date']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'address', 'phone_number']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            address=validated_data.get('address'),
            phone_number=validated_data.get('phone_number')
        )
        return user

class FavoriteSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'created_at']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def get_token(self, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        return token
    
class UserSerializer(serializers.ModelSerializer):
    class Meta: 
        model = User
        fields = ['id', 'username', 'full_name', 'email', 'address', 'phone_number', 'is_active', 'is_staff']


class EDExamSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True)
    image = serializers.ImageField(use_url=True, allow_null=True)

    class Meta:
        model = EDexam
        fields = ['title', 'created_at', 'exam_date', 'image', 'users', 'is_public']