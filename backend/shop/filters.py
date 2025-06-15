from django_filters import rest_framework as filters
from django.db.models import Avg
from .models import Product, Category, ProductVariation

class ProductFilter(filters.FilterSet):
    price_min = filters.NumberFilter(field_name='total_price', lookup_expr='gte')
    price_max = filters.NumberFilter(field_name='total_price', lookup_expr='lte')
    category = filters.CharFilter(method='filter_category')
    brand = filters.CharFilter(field_name='brand', lookup_expr='iexact')
    size = filters.MultipleChoiceFilter(
        choices=[(size, size) for size in ProductVariation.objects.values_list('size', flat=True).distinct()],
        method='filter_size',
    )
    color = filters.MultipleChoiceFilter(
        choices=[(color, color) for color in ProductVariation.objects.values_list('color', flat=True).distinct()],
        method='filter_color',
    )
    has_discount = filters.BooleanFilter(method='filter_has_discount')
    rating_min = filters.NumberFilter(method='filter_rating_min')

    class Meta:
        model = Product
        fields = ['price_min', 'price_max', 'category', 'brand', 'size', 'color', 'has_discount', 'rating_min']

    def filter_category(self, queryset, name, value):
        if value:
            slugs = [slug.strip() for slug in value.split(',') if slug.strip()]
            if slugs:
                queryset = queryset.filter(categories__slug__in=slugs).distinct()
        return queryset

    def filter_size(self, queryset, name, value):
        if value:
            queryset = queryset.filter(variations__size__in=value).distinct()
        return queryset

    def filter_color(self, queryset, name, value):
        if value:
            queryset = queryset.filter(variations__color__in=value).distinct()
        return queryset

    def filter_has_discount(self, queryset, name, value):
        if value:
            queryset = queryset.filter(discount_percentage__gt=0)
        return queryset

    def filter_rating_min(self, queryset, name, value):
        if value:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=value)
        return queryset