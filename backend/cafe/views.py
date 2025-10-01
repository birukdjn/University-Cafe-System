from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    UserProfile, Category, MenuItem, Order, OrderItem, Payment, 
    Table, Reservation, Review, Inventory, StaffSchedule, Notification
)
from .serializers import (
    UserSerializer, UserProfileSerializer, UserRegistrationSerializer,
    LoginSerializer, CategorySerializer, MenuItemSerializer, OrderSerializer,
    OrderCreateSerializer, OrderItemSerializer, PaymentSerializer,
    TableSerializer, ReservationSerializer, ReviewSerializer,
    InventorySerializer, StaffScheduleSerializer, NotificationSerializer,
    DashboardStatsSerializer
)
from .permissions import IsOwnerOrReadOnly, IsAdminOrReadOnly, IsStaffOrReadOnly


class UserViewSet(viewsets.ModelViewSet):
    """User management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'date_joined']
    ordering = ['username']


class UserProfileViewSet(viewsets.ModelViewSet):
    """User profile management"""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active']
    search_fields = ['user__username', 'user__first_name', 'user__last_name']
    ordering_fields = ['date_joined', 'role']
    ordering = ['-date_joined']


class AuthViewSet(viewsets.ViewSet):
    """Authentication views"""
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """User registration"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """User login"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            profile_data = None
            try:
                profile_data = UserProfileSerializer(user.profile).data
            except Exception:
                profile_data = None

            return Response({
                'user': UserSerializer(user).data,
                'profile': profile_data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout(self, request):
        """User logout"""
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)


class CategoryViewSet(viewsets.ModelViewSet):
    """Category management"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']


class MenuItemViewSet(viewsets.ModelViewSet):
    """Menu item management"""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'availability', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'category__name']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['category', 'name']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by availability for customers
        try:
            is_staff_member = getattr(self.request.user, 'profile', None) and getattr(self.request.user.profile, 'is_staff_member', False)
        except Exception:
            is_staff_member = False

        if not is_staff_member:
            queryset = queryset.filter(is_active=True, availability='available')
        return queryset


class OrderViewSet(viewsets.ModelViewSet):
    """Order management"""
    queryset = Order.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'payment_method']
    search_fields = ['customer__username', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Customers can only see their own orders
        if not self.request.user.profile.is_staff_member:
            queryset = queryset.filter(customer=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class DashboardStatsView(APIView):
    """Dashboard statistics"""
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    
    def get(self, request):
        today = timezone.now().date()
        
        # Basic stats
        total_orders = Order.objects.count()
        total_revenue = Order.objects.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        total_customers = User.objects.filter(profile__role='customer').count()
        total_menu_items = MenuItem.objects.filter(is_active=True).count()
        
        # Today's stats
        today_orders = Order.objects.filter(created_at__date=today).count()
        today_revenue = Order.objects.filter(created_at__date=today).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Pending orders
        pending_orders = Order.objects.filter(status__in=['pending', 'confirmed', 'preparing']).count()
        
        # Low stock items
        low_stock_items = Inventory.objects.filter(is_low_stock=True).count()
        
        stats = {
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'total_customers': total_customers,
            'total_menu_items': total_menu_items,
            'pending_orders': pending_orders,
            'low_stock_items': low_stock_items,
            'today_revenue': today_revenue,
            'today_orders': today_orders,
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)


class OrderItemViewSet(viewsets.ModelViewSet):
    """Order item management"""
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['order', 'menu_item']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class PaymentViewSet(viewsets.ModelViewSet):
    """Payment management"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_method']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']


class TableViewSet(viewsets.ModelViewSet):
    """Table management"""
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'is_active']
    ordering_fields = ['number', 'capacity']
    ordering = ['number']


class ReservationViewSet(viewsets.ModelViewSet):
    """Reservation management"""
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'date', 'table']
    ordering_fields = ['date', 'time', 'created_at']
    ordering = ['date', 'time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Customers can only see their own reservations
        if not self.request.user.profile.is_staff_member:
            queryset = queryset.filter(customer=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class ReviewViewSet(viewsets.ModelViewSet):
    """Review management"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['menu_item', 'rating', 'is_verified']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Customers can only see their own reviews
        if not self.request.user.profile.is_staff_member:
            queryset = queryset.filter(customer=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class InventoryViewSet(viewsets.ModelViewSet):
    """Inventory management"""
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'is_low_stock']
    search_fields = ['name', 'description', 'supplier']
    ordering_fields = ['name', 'current_stock', 'created_at']
    ordering = ['name']


class StaffScheduleViewSet(viewsets.ModelViewSet):
    """Staff schedule management"""
    queryset = StaffSchedule.objects.all()
    serializer_class = StaffScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['staff', 'day', 'is_active']
    ordering_fields = ['day', 'start_time']
    ordering = ['day', 'start_time']


class NotificationViewSet(viewsets.ModelViewSet):
    """Notification management"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['type', 'is_read']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Notification marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'All notifications marked as read'})


class SalesReportView(APIView):
    """Sales report generation"""
    permission_classes = [permissions.IsAuthenticated, IsStaffOrReadOnly]
    
    def get(self, request):
        period = request.GET.get('period', 'week')  # week, month, year
        end_date = timezone.now().date()
        
        if period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Sales data
        orders = Order.objects.filter(
            created_at__date__range=[start_date, end_date],
            status='completed'
        )
        
        daily_sales = []
        for i in range((end_date - start_date).days + 1):
            date = start_date + timedelta(days=i)
            day_orders = orders.filter(created_at__date=date)
            daily_revenue = day_orders.aggregate(total=Sum('total_amount'))['total'] or 0
            daily_orders = day_orders.count()
            
            daily_sales.append({
                'date': date.isoformat(),
                'revenue': float(daily_revenue),
                'orders': daily_orders
            })
        
        # Category sales
        category_sales = []
        for category in Category.objects.all():
            category_orders = orders.filter(order_items__menu_item__category=category)
            category_revenue = category_orders.aggregate(total=Sum('total_amount'))['total'] or 0
            category_orders_count = category_orders.count()
            
            category_sales.append({
                'category': category.name,
                'revenue': float(category_revenue),
                'orders': category_orders_count
            })
        
        return Response({
            'period': period,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'daily_sales': daily_sales,
            'category_sales': category_sales,
            'total_revenue': float(orders.aggregate(total=Sum('total_amount'))['total'] or 0),
            'total_orders': orders.count()
        })