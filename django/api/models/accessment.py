from django.db import models


class Accessment(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'

    @classmethod
    def defaults(cls):
        return cls.PENDING
