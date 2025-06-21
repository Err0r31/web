from django_filters import rest_framework as filters
from django.db.models import Avg
from .models import Product, Category, ProductVariation
from typing import Any
from django.db.models.query import QuerySet

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
    gender = filters.CharFilter(method='filter_gender')

    class Meta:
        model = Product
        fields = ['price_min', 'price_max', 'category', 'brand', 'size', 'color', 'has_discount', 'rating_min']

    def filter_category(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по слагу категории.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: строка слагов через запятую
        Returns:
            QuerySet: отфильтрованный по категориям queryset
        """
        if value:
            slugs = [slug.strip() for slug in value.split(',') if slug.strip()]
            if slugs:
                queryset = queryset.filter(categories__slug__in=slugs).distinct()
        return queryset

    def filter_size(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по размеру вариации продукта.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: список размеров
        Returns:
            QuerySet: отфильтрованный по размеру queryset
        """
        if value:
            queryset = queryset.filter(variations__size__in=value).distinct()
        return queryset

    def filter_color(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по цвету вариации продукта.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: список цветов
        Returns:
            QuerySet: отфильтрованный по цвету queryset
        """
        if value:
            queryset = queryset.filter(variations__color__in=value).distinct()
        return queryset

    def filter_has_discount(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по наличию скидки.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: булево значение
        Returns:
            QuerySet: отфильтрованный по скидке queryset
        """
        if value:
            queryset = queryset.filter(discount_percentage__gt=0)
        return queryset

    def filter_rating_min(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по минимальному рейтингу.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: минимальный рейтинг
        Returns:
            QuerySet: отфильтрованный по рейтингу queryset
        """
        if value:
            queryset = queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=value)
        return queryset
    
    def filter_gender(self, queryset: QuerySet, name: str, value: Any) -> QuerySet:
        """
        Фильтрация по гендеру категории.
        Args:
            queryset: QuerySet продуктов
            name: имя фильтра
            value: строка гендера
        Returns:
            QuerySet: отфильтрованный по гендеру queryset
        """
        if value:
            queryset = queryset.filter(categories__gender=value)
        return queryset