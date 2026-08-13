from django.db import models

# Create your models here.

class Postulation(models.Model):
    class State(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    id_postulation = models.BigAutoField(primary_key=True)
    status = models.CharField(max_length=20, choices=State.choices, default=State.PENDING)

    id_project=models.ForeignKey('projects.Project', on_delete=models.CASCADE, related_name='postulations')
    id_tester=models.ForeignKey('user.User', on_delete=models.CASCADE, related_name='postulations')

    postulation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['id_project', 'id_tester'], name='unique_postulation')
        ]
    def __str__(self):
        return f"{self.id_project} - {self.id_tester}"