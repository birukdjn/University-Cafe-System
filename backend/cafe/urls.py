from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profiles', views.UserProfileViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'menu-items', views.MenuItemViewSet)
router.register(r'orders', views.OrderViewSet)
router.register(r'order-items', views.OrderItemViewSet)
router.register(r'payments', views.PaymentViewSet)
router.register(r'tables', views.TableViewSet)
router.register(r'reservations', views.ReservationViewSet)
router.register(r'reviews', views.ReviewViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'staff-schedules', views.StaffScheduleViewSet)
router.register(r'notifications', views.NotificationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include([
        path('register/', views.AuthViewSet.as_view({'post': 'register'})),
        path('login/', views.AuthViewSet.as_view({'post': 'login'})),
        path('logout/', views.AuthViewSet.as_view({'post': 'logout'})),
        path('token/refresh/', TokenRefreshView.as_view()),
    ])),
    path('dashboard/stats/', views.DashboardStatsView.as_view()),
    path('reports/sales/', views.SalesReportView.as_view()),
]
