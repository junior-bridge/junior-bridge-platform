from django.db import models

# Create your models here.

class User(models.Model):
    name = models.CharField(max_length=100)
    surname = models.CharField(max_length=100)
    dni=models.CharField(max_length=20)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    password = models.CharField(max_length=100)

    SEXS = [
        ("M", "Male"),
        ("F", "Female"),
        ("O", "Other"),
    ]
    ROLES = [
        ("CLIENT", "Client"),
        ("TESTER", "Tester"),
        ("ADMIN", "Administrator"),
    ]

    role = models.CharField(max_length=50,choices=ROLES)
    sex = models.CharField(max_length=10, choices=SEXS)
    date_of_birth = models.DateField()
    reputation = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name