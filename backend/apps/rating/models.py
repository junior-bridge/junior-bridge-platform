from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator

# Create your models here.

class Rating(models.Model):
    id_rating = models.BigAutoField(primary_key=True)

    id_postulation=models.ForeignKey('postulations.Postulation', on_delete=models.CASCADE, related_name='ratings')

    stars=models.IntegerField(validators=[MinValueValidator(1),MaxValueValidator(5)])
    comment=models.TextField(null=True, blank=True, max_length=500,)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Rating #{self.id_rating} for Postulation #{self.id_postulation.id_postulation}"