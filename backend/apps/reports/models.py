from django.db import models

# Create your models here.

class Report(models.Model):
    STATES = [
        ("PENDING", "Pending"),
        ("REVIEW", "Review"),
        ("CLOSED", "Closed"),
    ]
    id_report = models.BigAutoField(primary_key=True)
    id_postulation=models.ForeignKey('postulations.Postulation', on_delete=models.CASCADE, related_name='reports')
    title=models.CharField(max_length=255)
    description=models.TextField()
    risk_level=models.CharField(max_length=50)
    capture_evidence=models.FileField(upload_to='reports/evidence/', null=True, blank=True) 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    state = models.CharField(max_length=20, choices=STATES, default="PENDING")
    def __str__(self):
        return f"Report #{self.id} by {self.reporter.name} against {self.reported_user.name}"
