from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return getattr(request.user, 'is_authenticated', False) and getattr(obj, 'customer', None) == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, 'is_authenticated', False) and getattr(getattr(request.user, 'profile', None), 'is_admin', False)


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow staff members to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return getattr(request.user, 'is_authenticated', False) and getattr(getattr(request.user, 'profile', None), 'is_staff_member', False)


class IsAdmin(permissions.BasePermission):
    """
    Custom permission to only allow admins.
    """
    def has_permission(self, request, view):
        return getattr(request.user, 'is_authenticated', False) and getattr(getattr(request.user, 'profile', None), 'is_admin', False)


class IsStaff(permissions.BasePermission):
    """
    Custom permission to only allow staff members.
    """
    def has_permission(self, request, view):
        return getattr(request.user, 'is_authenticated', False) and getattr(getattr(request.user, 'profile', None), 'is_staff_member', False)
