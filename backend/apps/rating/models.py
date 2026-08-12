from django.db import models

# Create your models here.

class Rating(models.Model):
    id_rating = models.BigAutoField(primary_key=True)

    id_postulation=models.ForeignKey('postulations.Postulation', on_delete=models.CASCADE, related_name='ratings')

    stars=models.IntegerField()
    comment=models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Rating #{self.id} for Postulation #{self.id_postulation.id}"