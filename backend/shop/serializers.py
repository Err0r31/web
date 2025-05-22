from rest_framework import serializers
from .models import Banner, Product, Outfit, User

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'address', 'phone_number')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
        )
        return user


class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ['id', 'title', 'description', 'image', 'link', 'is_active', 'created_at']
        extra_kwargs = {
            'image': {'required': False}
        }


class ProductSerializer(serializers.ModelSerializer):
    last_category_name = serializers.SerializerMethodField()
    image = serializers.ImageField(use_url=True)

    def get_last_category_name(self, obj):
        last_category = obj.categories.last()
        return last_category.name if last_category else ""

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'price', 'discount_percentage',
            'is_recommended', 'image', 'created_at', 'categories',
            'last_category_name', 'total_price'
        ]
        extra_kwargs = {
            'image': {'required': False}
        }


class OutfitSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    image = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = Outfit
        fields = ['id', 'name', 'products', 'total_price', 'created_at', 'image']