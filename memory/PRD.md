# Outfit Shopci - E-commerce Fashion Platform

## Project Overview
Modern e-commerce website for clothing and accessories (men & women) in Côte d'Ivoire.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB
- **Storage**: Emergent Object Storage (for product images)
- **Authentication**: JWT (httpOnly cookies)
- **Payments**: Mobile Money simulation (Orange, MTN, Wave, Moov)

## User Personas
1. **Shopper**: Browse products, add to cart, checkout with Mobile Money
2. **Admin**: Manage products, view orders, create promo codes

## Core Requirements
- [x] Homepage with hero, categories, best sellers, new arrivals
- [x] Product listing with filters (category, price) and sorting
- [x] Product detail with size/color selection, reviews
- [x] Shopping cart with quantity management
- [x] Checkout flow with shipping, payment selection, promo codes
- [x] Mobile Money payment simulation
- [x] User authentication (register, login, logout)
- [x] User account with order history
- [x] Favorites/wishlist functionality
- [x] Search functionality
- [x] Responsive design (mobile, tablet, desktop)

## What's Been Implemented (Jan 2026)
- Complete e-commerce frontend with minimalist luxury design
- JWT authentication with secure httpOnly cookies
- Product catalog with 8 sample products
- Shopping cart with real-time updates
- 4-step checkout flow (Shipping → Payment → Confirmation → Success)
- Mobile Money payment simulation
- Promo code system (BIENVENUE10 - 10% discount)
- Free shipping above 25,000 FCFA
- Customer reviews with star ratings
- Favorites/wishlist
- Search modal with live results
- Mobile responsive navigation
- User account with order history

## Prioritized Backlog

### P0 (Critical) - Done
- [x] Core e-commerce flow
- [x] Authentication
- [x] Cart & checkout
- [x] Mobile Money simulation

### P1 (High Priority) - Next Phase
- [ ] Admin dashboard for product management
- [ ] Real Mobile Money API integration (Orange/MTN/Wave/Moov)
- [ ] Email notifications (order confirmation)
- [ ] Order tracking with status updates

### P2 (Medium Priority)
- [ ] Product image upload via admin
- [ ] Advanced filtering (sizes, colors checkboxes)
- [ ] Recently viewed products
- [ ] Product recommendations
- [ ] Customer service chat

### P3 (Low Priority)
- [ ] Social login (Google, Facebook)
- [ ] Multi-language support
- [ ] Loyalty points system
- [ ] Gift cards
- [ ] Advanced analytics dashboard

## API Endpoints
- Auth: /api/auth/register, login, logout, me, refresh
- Products: /api/products (GET, POST), /api/products/{id} (GET, PUT, DELETE)
- Categories: /api/categories (GET)
- Cart: /api/cart (GET, POST, DELETE), /api/cart/{id} (PUT, DELETE)
- Favorites: /api/favorites (GET), /api/favorites/{id} (POST, DELETE)
- Reviews: /api/reviews/{product_id} (GET), /api/reviews (POST)
- Orders: /api/orders (GET, POST), /api/orders/{id} (GET), /api/orders/{id}/payment (PUT)
- Promo: /api/promo-codes/validate (POST)

## Test Credentials
- Admin: admin@outfitshopci.com / Admin123!
- Promo Code: BIENVENUE10 (10% off)
