from django.db import models
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageDraw
import datetime

class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100)
    phone = models.CharField(max_length=15)
    department = models.CharField(max_length=100)
    year = models.IntegerField()
    image = models.ImageField(upload_to='media/', blank=True, null=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    date_registered = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} ({self.student_id})"
    
    def save(self, *args, **kwargs):
        # Generate QR code when student is created
        if not self.qr_code:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr_data = f"STUDENT_ID:{self.student_id}|NAME:{self.name}|DEPT:{self.department}"
            qr.add_data(qr_data)
            qr.make(fit=True)
            
            qr_img = qr.make_image(fill_color="black", back_color="white")
            # Ensure we have a PIL Image in RGB mode and size it to fit the canvas
            try:
                qr_pil = qr_img.convert('RGB')
            except Exception:
                # qr_img may already be a PIL image but not support convert
                qr_pil = Image.new('RGB', qr_img.size)
                qr_pil.paste(qr_img)

            canvas_size = (400, 400)
            canvas = Image.new('RGB', canvas_size, 'white')

            # Resize QR if it's larger than the canvas minus margin
            max_inner = 360
            w, h = qr_pil.size
            if w > max_inner or h > max_inner:
                ratio = min(max_inner / w, max_inner / h)
                new_size = (max(1, int(w * ratio)), max(1, int(h * ratio)))
                qr_pil = qr_pil.resize(new_size, Image.LANCZOS)
                w, h = qr_pil.size

            # Center the QR on the canvas using a 2-tuple box
            offset = ((canvas_size[0] - w) // 2, (canvas_size[1] - h) // 2)
            canvas.paste(qr_pil, offset)
            
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            # Ensure buffer is rewound before saving
            buffer.seek(0)
            self.qr_code.save(
                f'qr_code_{self.student_id}.png',
                File(buffer),
                save=False
            )
            buffer.close()
        
        super().save(*args, **kwargs)


class MealLog(models.Model):
    log_id = models.AutoField(primary_key=True, unique=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    meal_type = models.CharField(
        max_length=20,
        choices=[
            ("breakfast", "Breakfast"),
            ("lunch", "Lunch"),
            ("dinner", "Dinner"),
        ]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.student.name} - {self.meal_type} at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"