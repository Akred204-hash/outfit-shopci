#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class OutfitShopciAPITester:
    def __init__(self, base_url="https://trend-apparel-3.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.status_code, response.json() if response.content else {}
            
        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login"""
        success, status, response = self.make_request(
            'POST', 'auth/login',
            data={"email": "admin@outfitshopci.com", "password": "Admin123!"}
        )
        
        if success and 'id' in response:
            # Try to get token from cookies or response
            self.log_test("Admin Login", True)
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"testuser_{datetime.now().strftime('%H%M%S')}@example.com"
        success, status, response = self.make_request(
            'POST', 'auth/register',
            data={
                "email": test_email,
                "password": "Test123!",
                "name": "Test User",
                "phone": "+225 07 00 00 00 00"
            }
        )
        
        if success and 'id' in response:
            self.log_test("User Registration", True)
            return test_email
        else:
            self.log_test("User Registration", False, f"Status: {status}, Response: {response}")
            return None

    def test_user_login(self, email="test@example.com", password="Test123!"):
        """Test user login"""
        success, status, response = self.make_request(
            'POST', 'auth/login',
            data={"email": email, "password": password}
        )
        
        if success and 'id' in response:
            self.log_test("User Login", True)
            return True
        else:
            self.log_test("User Login", False, f"Status: {status}, Response: {response}")
            return False

    def test_get_products(self):
        """Test get products endpoint"""
        success, status, response = self.make_request('GET', 'products')
        
        if success and isinstance(response, list):
            self.log_test(f"Get Products ({len(response)} products)", True)
            return response
        else:
            self.log_test("Get Products", False, f"Status: {status}")
            return []

    def test_get_categories(self):
        """Test get categories endpoint"""
        success, status, response = self.make_request('GET', 'categories')
        
        if success and isinstance(response, list) and len(response) > 0:
            self.log_test(f"Get Categories ({len(response)} categories)", True)
            return response
        else:
            self.log_test("Get Categories", False, f"Status: {status}")
            return []

    def test_product_filters(self):
        """Test product filtering"""
        # Test category filter
        success, status, response = self.make_request('GET', 'products?category=robes')
        if success:
            self.log_test("Product Filter - Category", True)
        else:
            self.log_test("Product Filter - Category", False, f"Status: {status}")

        # Test price filter
        success, status, response = self.make_request('GET', 'products?min_price=10000&max_price=30000')
        if success:
            self.log_test("Product Filter - Price Range", True)
        else:
            self.log_test("Product Filter - Price Range", False, f"Status: {status}")

        # Test bestsellers filter
        success, status, response = self.make_request('GET', 'products?is_bestseller=true')
        if success:
            self.log_test("Product Filter - Bestsellers", True)
        else:
            self.log_test("Product Filter - Bestsellers", False, f"Status: {status}")

    def test_product_search(self):
        """Test product search"""
        success, status, response = self.make_request('GET', 'products?search=robe')
        
        if success:
            self.log_test("Product Search", True)
        else:
            self.log_test("Product Search", False, f"Status: {status}")

    def test_product_sorting(self):
        """Test product sorting"""
        sort_options = ['newest', 'price_asc', 'price_desc', 'popular']
        
        for sort_option in sort_options:
            success, status, response = self.make_request('GET', f'products?sort={sort_option}')
            if success:
                self.log_test(f"Product Sort - {sort_option}", True)
            else:
                self.log_test(f"Product Sort - {sort_option}", False, f"Status: {status}")

    def test_get_single_product(self, products):
        """Test get single product"""
        if not products:
            self.log_test("Get Single Product", False, "No products available")
            return None
            
        product_id = products[0]['id']
        success, status, response = self.make_request('GET', f'products/{product_id}')
        
        if success and 'id' in response:
            self.log_test("Get Single Product", True)
            return response
        else:
            self.log_test("Get Single Product", False, f"Status: {status}")
            return None

    def test_promo_code_validation(self):
        """Test promo code validation"""
        success, status, response = self.make_request(
            'POST', 'promo-codes/validate?code=BIENVENUE10&subtotal=50000'
        )
        
        if success and 'discount_amount' in response:
            discount = response.get('discount_amount', 0)
            expected_discount = 50000 * 0.1  # 10% of 50000
            if abs(discount - expected_discount) < 1:  # Allow small floating point differences
                self.log_test("Promo Code BIENVENUE10", True)
            else:
                self.log_test("Promo Code BIENVENUE10", False, f"Wrong discount: {discount}, expected: {expected_discount}")
        else:
            self.log_test("Promo Code BIENVENUE10", False, f"Status: {status}, Response: {response}")

    def make_request_no_session(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request without session (for testing unauthenticated access)"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.status_code, response.json() if response.content else {}
            
        except Exception as e:
            return False, 0, {"error": str(e)}

    def test_cart_operations_without_auth(self):
        """Test cart operations without authentication (should fail)"""
        # Test get cart without auth using fresh request
        success, status, response = self.make_request_no_session('GET', 'cart')
        
        # Check if response contains authentication error
        if status == 401 or (isinstance(response, dict) and response.get('detail') == 'Not authenticated'):
            self.log_test("Cart Access Without Auth (Should Fail)", True)
        else:
            self.log_test("Cart Access Without Auth (Should Fail)", False, f"Status: {status}, Response: {response}")

    def test_favorites_without_auth(self):
        """Test favorites without authentication (should fail)"""
        success, status, response = self.make_request_no_session('GET', 'favorites')
        
        # Check if response contains authentication error
        if status == 401 or (isinstance(response, dict) and response.get('detail') == 'Not authenticated'):
            self.log_test("Favorites Access Without Auth (Should Fail)", True)
        else:
            self.log_test("Favorites Access Without Auth (Should Fail)", False, f"Status: {status}, Response: {response}")

    def test_orders_without_auth(self):
        """Test orders without authentication (should fail)"""
        success, status, response = self.make_request_no_session('GET', 'orders')
        
        # Check if response contains authentication error
        if status == 401 or (isinstance(response, dict) and response.get('detail') == 'Not authenticated'):
            self.log_test("Orders Access Without Auth (Should Fail)", True)
        else:
            self.log_test("Orders Access Without Auth (Should Fail)", False, f"Status: {status}, Response: {response}")

    def test_reviews_public_access(self, product):
        """Test reviews public access (should work without auth)"""
        if not product:
            self.log_test("Get Product Reviews", False, "No product available")
            return
            
        success, status, response = self.make_request('GET', f'reviews/{product["id"]}')
        
        if success and isinstance(response, list):
            self.log_test("Get Product Reviews (Public)", True)
        else:
            self.log_test("Get Product Reviews (Public)", False, f"Status: {status}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Outfit Shopci Backend API Tests")
        print("=" * 50)
        
        # Test authentication
        print("\n📝 Testing Authentication...")
        admin_login_success = self.test_admin_login()
        test_email = self.test_user_registration()
        if test_email:
            user_login_success = self.test_user_login(test_email, "Test123!")
        else:
            user_login_success = self.test_user_login()  # Try with default test user
        
        # Test public endpoints
        print("\n🛍️ Testing Public Endpoints...")
        products = self.test_get_products()
        categories = self.test_get_categories()
        product = self.test_get_single_product(products)
        
        # Test product features
        print("\n🔍 Testing Product Features...")
        self.test_product_filters()
        self.test_product_search()
        self.test_product_sorting()
        
        # Test promo codes
        print("\n🎫 Testing Promo Codes...")
        self.test_promo_code_validation()
        
        # Test protected endpoints without auth
        print("\n🔒 Testing Protected Endpoints (Without Auth)...")
        self.test_cart_operations_without_auth()
        self.test_favorites_without_auth()
        self.test_orders_without_auth()
        
        # Test public reviews
        print("\n⭐ Testing Reviews...")
        self.test_reviews_public_access(product)
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    tester = OutfitShopciAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())