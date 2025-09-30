from django.contrib import admin
from .models import Student, MealLog


# Custom Admin for Student model
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = (
        'student_id',
        'name',
        'email',
        'phone',
        'department',
        'year',
        
    )
    search_fields = ('name', 'student_id', 'email')
    list_filter = ('department', 'year')
    ordering = ('student_id',)

    fieldsets = (
        (None, {
            'fields': ('student_id', 'name', 'email', 'phone','image')
        }),
        ('Academic Info', {
            'fields': ('department', 'year')
        }),
    )


# Custom Admin for MealLog model
@admin.register(MealLog)
class MealLogAdmin(admin.ModelAdmin):
    list_display = (
        'log_id',
        'student',
        'meal_type',
        'timestamp',
        'description_short',
    )
    list_filter = ('meal_type', 'timestamp', 'student__department')
    search_fields = ('student__name', 'meal_type')

    # Make all fields read-only (logs are immutable)
    readonly_fields = [field.name for field in MealLog._meta.get_fields()]

    def has_add_permission(self, request):
        return False  # prevent adding logs manually in admin

    def has_delete_permission(self, request, obj=None):
        return False  # prevent deleting logs

    def has_change_permission(self, request, obj=None):
        return True  # allow viewing logs

    # Helper method to show shortened description in list view
    def description_short(self, obj):
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return "-"
    description_short.short_description = 'Description'
