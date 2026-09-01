from django.db import models

# Create your models here.

class Notification(models.Model):
    id_notification = models.BigAutoField(primary_key=True)
    id_user=models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications')

    type=models.CharField(max_length=50)
    message=models.TextField()
    is_read=models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"Notification #{self.id} for User #{self.id_user.id}"