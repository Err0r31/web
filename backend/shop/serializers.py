from rest_framework import serializers
from .models import Banner, Product, Order, Category, User, Review, ProductVariation

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())

    class Meta:
        model = Review
        fields = ['id', 'product', 'user', 'rating', 'comment', 'created_at', 'updated_at']


class ProductVariationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariation
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    last_category_name = serializers.SerializerMethodField()
    categories = CategorySerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    variations = ProductVariationSerializer(many=True, read_only=True)

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