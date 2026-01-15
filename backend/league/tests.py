from django.test import TestCase
from django.contrib.auth.models import User
from .models import House

class HouseTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testadmin', password='password')

    def test_house_creation(self):
        house = House.objects.create(name="Test House", admin=self.user)
        self.assertEqual(house.name, "Test House")
        self.assertEqual(house.admin, self.user)
        self.assertTrue(house.invite_code)  # Check if invite code is generated
