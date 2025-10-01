from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import (
    UserProfile, Category, MenuItem, Order, OrderItem, Payment, 
    Table, Reservation, Review, Inventory, StaffSchedule, Notification
)


class UserSerializer(serializers.ModelSerializer):
    """User serializer"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role', 'phone', 'address', 'date_joined', 'is_active']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default='customer')
    phone = serializers.CharField(max_length=15, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        password_confirm = validated_data.pop('password_confirm')
        role = validated_data.pop('role', 'customer')
        phone = validated_data.pop('phone', '')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """Login serializer"""
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include username and password')
        
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    """Category serializer"""
    menu_items_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'is_active', 'created_at', 'updated_at', 'menu_items_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'menu_items_count']
    
    def get_menu_items_count(self, obj):
        return obj.menu_items.filter(is_active=True).count()


class MenuItemSerializer(serializers.ModelSerializer):
    """Menu item serializer"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    image_url = serializers.SerializerMethodField()
    profit_margin = serializers.ReadOnlyField()
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'category', 'category_name', 'price', 'cost',
            'image', 'image_url', 'availability', 'preparation_time', 'calories',
            'allergens', 'is_featured', 'is_active', 'created_at', 'updated_at', 'profit_margin'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'profit_margin']
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    """Order item serializer"""
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_image = serializers.SerializerMethodField()
    total_price = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_image', 'quantity',
            'unit_price', 'special_instructions', 'total_price'
        ]
        read_only_fields = ['id', 'total_price']
    
    def get_menu_item_image(self, obj):
        if obj.menu_item.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.menu_item.image.url)
        return None


class OrderSerializer(serializers.ModelSerializer):
    """Order serializer"""
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'customer_name', 'customer_username', 'status', 'status_display',
            'payment_status', 'payment_status_display', 'payment_method', 'subtotal',
            'tax_amount', 'total_amount', 'notes', 'created_at', 'updated_at',
            'completed_at', 'order_items'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total_amount', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Order creation serializer"""
    order_items = OrderItemSerializer(many=True)
    
    class Meta:
        model = Order
        fields = ['payment_method', 'notes', 'order_items']
    
    def create(self, validated_data):
        order_items_data = validated_data.pop('order_items')
        order = Order.objects.create(**validated_data)
        
        for item_data in order_items_data:
            OrderItem.objects.create(order=order, **item_data)
        
        return order


class PaymentSerializer(serializers.ModelSerializer):
    """Payment serializer"""
    order_id = serializers.CharField(source='order.id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_id', 'amount', 'payment_method', 'status',
            'status_display', 'transaction_id', 'created_at', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'completed_at']


class TableSerializer(serializers.ModelSerializer):
    """Table serializer"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Table
        fields = ['id', 'number', 'capacity', 'status', 'status_display', 'location', 'is_active']
        read_only_fields = ['id']


class ReservationSerializer(serializers.ModelSerializer):
    """Reservation serializer"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'customer', 'customer_name', 'table', 'table_number', 'date', 'time',
            'duration', 'party_size', 'status', 'status_display', 'special_requests',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    """Review serializer"""
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'customer', 'customer_name', 'menu_item', 'menu_item_name',
            'order', 'rating', 'rating_display', 'comment', 'is_verified', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InventorySerializer(serializers.ModelSerializer):
    """Inventory serializer"""
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'name', 'description', 'current_stock', 'minimum_stock', 'unit',
            'cost_per_unit', 'supplier', 'last_restocked', 'is_active', 'is_low_stock',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_low_stock', 'created_at', 'updated_at']


class StaffScheduleSerializer(serializers.ModelSerializer):
    """Staff schedule serializer"""
    staff_name = serializers.CharField(source='staff.get_full_name', read_only=True)
    day_display = serializers.CharField(source='get_day_display', read_only=True)
    
    class Meta:
        model = StaffSchedule
        fields = [
            'id', 'staff', 'staff_name', 'day', 'day_display', 'start_time',
            'end_time', 'is_active'
        ]
        read_only_fields = ['id']


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'type', 'type_display', 'title', 'message',
            'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DashboardStatsSerializer(serializers.Serializer):
    """Dashboard statistics serializer"""
    total_orders = serializers.IntegerField()
    total_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_customers = serializers.IntegerField()
    total_menu_items = serializers.IntegerField()
    pending_orders = serializers.IntegerField()
    low_stock_items = serializers.IntegerField()
    today_revenue = serializers.DecimalField(max_digits=10, decimal_places=2)
    today_orders = serializers.IntegerField()
