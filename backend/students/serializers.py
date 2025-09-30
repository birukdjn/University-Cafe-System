from rest_framework import serializers
from .models import Student, MealLog

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class MealLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealLog
        fields = '__all__'
