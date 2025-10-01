from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import (
    UserProfile, Category, MenuItem, Order, OrderItem, Payment,
    Table, Reservation, Review, Inventory, StaffSchedule, Notification
)


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'phone']
    ordering = ['-date_joined']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['name']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'availability', 'is_featured', 'is_active']
    list_filter = ['category', 'availability', 'is_featured', 'is_active', 'created_at']
    search_fields = ['name', 'description', 'category__name']
    ordering = ['category', 'name']
    readonly_fields = ['profit_margin']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'status', 'payment_status', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'payment_method', 'created_at']
    search_fields = ['customer__username', 'customer__first_name', 'customer__last_name']
    ordering = ['-created_at']
    inlines = [OrderItemInline]
    readonly_fields = ['id', 'subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'menu_item', 'quantity', 'unit_price', 'total_price']
    list_filter = ['order__status', 'menu_item__category']
    search_fields = ['order__customer__username', 'menu_item__name']
    readonly_fields = ['total_price']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['order', 'amount', 'payment_method', 'status', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['order__customer__username', 'transaction_id']
    ordering = ['-created_at']


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'status', 'location', 'is_active']
    list_filter = ['status', 'is_active']
    search_fields = ['number', 'location']
    ordering = ['number']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['customer', 'table', 'date', 'time', 'party_size', 'status']
    list_filter = ['status', 'date', 'table']
    search_fields = ['customer__username', 'table__number']
    ordering = ['date', 'time']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['customer', 'menu_item', 'rating', 'is_verified', 'created_at']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['customer__username', 'menu_item__name']
    ordering = ['-created_at']


@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'current_stock', 'minimum_stock', 'unit', 'is_low_stock', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'supplier']
    ordering = ['name']
    readonly_fields = ['is_low_stock']


@admin.register(StaffSchedule)
class StaffScheduleAdmin(admin.ModelAdmin):
    list_display = ['staff', 'day', 'start_time', 'end_time', 'is_active']
    list_filter = ['day', 'is_active']
    search_fields = ['staff__username']
    ordering = ['day', 'start_time']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    ordering = ['-created_at']


# Unregister the default User admin and register our custom one
admin.site.unregister(User)
admin.site.register(User, UserAdmin)