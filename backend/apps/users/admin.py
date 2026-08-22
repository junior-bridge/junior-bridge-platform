from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'role', 'reputation', 'created_at', 'is_active']
    list_filter = ['role', 'created_at', 'is_active']
    search_fields = ['email', 'name', 'surname']
    readonly_fields = ['reputation', 'date_joined', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Usuario', {
            'fields': ('email', 'password', 'is_active', 'is_staff', 'is_superuser')
        }),
        ('Información Personal', {
            'fields': ('name', 'surname', 'dni', 'phone', 'sex', 'date_of_birth', 'zona')
        }),
        ('Rol y Reputación', {
            'fields': ('role', 'reputation')
        }),
        ('Fechas', {
            'fields': ('date_joined', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )