from rest_framework import serializers
from .models import Student, MealLog

class StudentSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Student
        fields = '__all__'
    
    def get_qr_code_url(self, obj):
        if obj.qr_code:
            return obj.qr_code.url
        return None

class MealLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    
    class Meta:
        model = MealLog
        fields = '__all__'