from django.db import models

# Create your models here.

class Report(models.Model):
    STATES = [
        ("PENDING", "Pending"),
        ("REVIEW", "Review"),
        ("CLOSED", "Closed"),
    ]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    data=models.TextField()
    work = models.ForeignKey('proyects.Work', on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    state = models.CharField(max_length=20, choices=STATES, default="PENDING")
    def __str__(self):
        return f"Report #{self.id} by {self.reporter.name} against {self.reported_user.name}"