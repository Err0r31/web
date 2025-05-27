from rest_framework import serializers
from .models import Banner, Product, Order, Category, User, Review, ProductVariation, ProductColorImage
import re

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Рейтинг должен быть от 1 до 5.")
        return value

    def validate(self, data):
        product = data.get('product')
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if Review.objects.filter(product=product, user=request.user).exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Вы уже оставили отзыв на этот продукт.'
                })
        return data

    def validate_product(self, value):
        if not Product.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Продукт не существует.")
        return value

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at', 'updated_at']


class ProductColorImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    def validate_color(self, value):
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise serializers.ValidationError('Цвет должен быть в формате HEX, например, #ffffff.')
        return value.lower()

    class Meta:
        model = ProductColorImage
        fields = ['id', 'image', 'color', 'created_at']


class ProductVariationSerializer(serializers.ModelSerializer):
    def validate_color(self, value):
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise serializers.ValidationError('Цвет должен быть в формате HEX, например, #ffffff.')
        value = value.lower()
        product_id = self.initial_data.get('product')
        if product_id and not ProductColorImage.objects.filter(product_id=product_id, color=value).exists():
            raise serializers.ValidationError(f'Для цвета {value} нет изображений.')
        return value
    
    class Meta:
        model = ProductVariation
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    last_category_name = serializers.SerializerMethodField()
    categories = CategorySerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)
    color_images = ProductColorImageSerializer(many=True, read_only=True)

    def get_last_category_name(self, obj):
        last_category = obj.categories.last()
        return last_category.name if last_category else ""

    class Meta:
        model = Product
        fields = '__all__'


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'description', 'is_active', 'image', 'link']


class OrderSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'user', 'status', 'total_price', 'order_date']


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