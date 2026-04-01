from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, File, UploadFile, Depends, Query
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests
from bson import ObjectId

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "outfit-shopci"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# JWT Configuration
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except:
        return None

# Pydantic Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "user"

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    subcategory: Optional[str] = None
    sizes: List[str] = []
    colors: List[str] = []
    images: List[str] = []
    stock: int = 0
    is_featured: bool = False
    is_bestseller: bool = False
    is_new: bool = True

class ProductResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    original_price: Optional[float] = None
    category: str
    subcategory: Optional[str] = None
    sizes: List[str] = []
    colors: List[str] = []
    images: List[str] = []
    stock: int = 0
    is_featured: bool = False
    is_bestseller: bool = False
    is_new: bool = True
    rating: float = 0
    reviews_count: int = 0
    created_at: str

class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str
    color: str

class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product: Optional[ProductResponse] = None
    quantity: int
    size: str
    color: str

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
    created_at: str

class OrderCreate(BaseModel):
    items: List[CartItem]
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    payment_method: str
    promo_code: Optional[str] = None

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[dict]
    subtotal: float
    shipping: float
    discount: float
    total: float
    status: str
    payment_method: str
    payment_status: str
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    created_at: str

class PromoCodeCreate(BaseModel):
    code: str
    discount_percent: int
    min_purchase: float = 0
    max_uses: int = 100
    expires_at: Optional[str] = None

class PromoCodeResponse(BaseModel):
    id: str
    code: str
    discount_percent: int
    min_purchase: float
    is_active: bool

# Create FastAPI app
app = FastAPI(title="Outfit Shopci API")
api_router = APIRouter(prefix="/api")

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/register")
async def register(user_data: UserRegister, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "user"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    email = credentials.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user["name"], "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user_id = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== PRODUCT ROUTES ====================
@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    sort: Optional[str] = "newest",
    is_featured: Optional[bool] = None,
    is_bestseller: Optional[bool] = None,
    limit: int = 50
):
    query = {}
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if size:
        query["sizes"] = size
    if color:
        query["colors"] = color
    if is_featured is not None:
        query["is_featured"] = is_featured
    if is_bestseller is not None:
        query["is_bestseller"] = is_bestseller
    
    sort_field = {"newest": ("created_at", -1), "price_asc": ("price", 1), "price_desc": ("price", -1), "popular": ("reviews_count", -1)}
    sort_key, sort_dir = sort_field.get(sort, ("created_at", -1))
    
    products = await db.products.find(query, {"_id": 0}).sort(sort_key, sort_dir).limit(limit).to_list(limit)
    return products

@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=ProductResponse)
async def create_product(product: ProductCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    product_doc = product.model_dump()
    product_doc["id"] = str(uuid.uuid4())
    product_doc["rating"] = 0
    product_doc["reviews_count"] = 0
    product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.products.insert_one(product_doc)
    del product_doc["_id"]
    return product_doc

@api_router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(product_id: str, product: ProductCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    update_data = product.model_dump()
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ==================== CART ROUTES ====================
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    cart_items = await db.cart.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    for item in cart_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        item["product"] = product
    
    return cart_items

@api_router.post("/cart")
async def add_to_cart(item: CartItem, request: Request):
    user = await get_current_user(request)
    
    existing = await db.cart.find_one({
        "user_id": user["id"],
        "product_id": item.product_id,
        "size": item.size,
        "color": item.color
    })
    
    if existing:
        await db.cart.update_one(
            {"_id": existing["_id"]},
            {"$inc": {"quantity": item.quantity}}
        )
    else:
        cart_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": item.product_id,
            "quantity": item.quantity,
            "size": item.size,
            "color": item.color
        }
        await db.cart.insert_one(cart_doc)
    
    return {"message": "Added to cart"}

@api_router.put("/cart/{item_id}")
async def update_cart_item(item_id: str, quantity: int = Query(...), request: Request = None):
    user = await get_current_user(request)
    
    if quantity <= 0:
        await db.cart.delete_one({"id": item_id, "user_id": user["id"]})
    else:
        await db.cart.update_one(
            {"id": item_id, "user_id": user["id"]},
            {"$set": {"quantity": quantity}}
        )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: str, request: Request):
    user = await get_current_user(request)
    await db.cart.delete_one({"id": item_id, "user_id": user["id"]})
    return {"message": "Removed from cart"}

@api_router.delete("/cart")
async def clear_cart(request: Request):
    user = await get_current_user(request)
    await db.cart.delete_many({"user_id": user["id"]})
    return {"message": "Cart cleared"}

# ==================== FAVORITES ROUTES ====================
@api_router.get("/favorites")
async def get_favorites(request: Request):
    user = await get_current_user(request)
    favorites = await db.favorites.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    
    product_ids = [f["product_id"] for f in favorites]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    
    return products

@api_router.post("/favorites/{product_id}")
async def add_to_favorites(product_id: str, request: Request):
    user = await get_current_user(request)
    
    existing = await db.favorites.find_one({"user_id": user["id"], "product_id": product_id})
    if not existing:
        await db.favorites.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "product_id": product_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Added to favorites"}

@api_router.delete("/favorites/{product_id}")
async def remove_from_favorites(product_id: str, request: Request):
    user = await get_current_user(request)
    await db.favorites.delete_one({"user_id": user["id"], "product_id": product_id})
    return {"message": "Removed from favorites"}

# ==================== REVIEWS ROUTES ====================
@api_router.get("/reviews/{product_id}", response_model=List[ReviewResponse])
async def get_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return reviews

@api_router.post("/reviews", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, request: Request):
    user = await get_current_user(request)
    
    existing = await db.reviews.find_one({"product_id": review.product_id, "user_id": user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="You already reviewed this product")
    
    review_doc = {
        "id": str(uuid.uuid4()),
        "product_id": review.product_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "rating": min(5, max(1, review.rating)),
        "comment": review.comment,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reviews.insert_one(review_doc)
    
    # Update product rating
    reviews = await db.reviews.find({"product_id": review.product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": review.product_id},
        {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
    )
    
    del review_doc["_id"]
    return review_doc

# ==================== PROMO CODES ROUTES ====================
@api_router.post("/promo-codes/validate")
async def validate_promo_code(code: str = Query(...), subtotal: float = Query(...)):
    promo = await db.promo_codes.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    if not promo:
        raise HTTPException(status_code=400, detail="Invalid promo code")
    
    if promo.get("expires_at") and datetime.fromisoformat(promo["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Promo code expired")
    
    if subtotal < promo.get("min_purchase", 0):
        raise HTTPException(status_code=400, detail=f"Minimum purchase: {promo['min_purchase']} FCFA")
    
    discount = (subtotal * promo["discount_percent"]) / 100
    return {"code": promo["code"], "discount_percent": promo["discount_percent"], "discount_amount": discount}

@api_router.post("/promo-codes")
async def create_promo_code(promo: PromoCodeCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    promo_doc = {
        "id": str(uuid.uuid4()),
        "code": promo.code.upper(),
        "discount_percent": promo.discount_percent,
        "min_purchase": promo.min_purchase,
        "max_uses": promo.max_uses,
        "uses": 0,
        "is_active": True,
        "expires_at": promo.expires_at,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.promo_codes.insert_one(promo_doc)
    del promo_doc["_id"]
    return promo_doc

# ==================== ORDERS ROUTES ====================
@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, request: Request):
    user = await get_current_user(request)
    
    # Calculate totals
    items_with_details = []
    subtotal = 0
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        item_total = product["price"] * item.quantity
        subtotal += item_total
        items_with_details.append({
            "product_id": item.product_id,
            "product_name": product["name"],
            "product_image": product["images"][0] if product["images"] else None,
            "price": product["price"],
            "quantity": item.quantity,
            "size": item.size,
            "color": item.color,
            "total": item_total
        })
    
    # Calculate shipping (free above 25000 FCFA)
    shipping = 0 if subtotal >= 25000 else 2500
    
    # Apply promo code
    discount = 0
    if order_data.promo_code:
        try:
            promo_result = await validate_promo_code(order_data.promo_code, subtotal)
            discount = promo_result["discount_amount"]
        except:
            pass
    
    total = subtotal + shipping - discount
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "items": items_with_details,
        "subtotal": subtotal,
        "shipping": shipping,
        "discount": discount,
        "total": total,
        "status": "pending",
        "payment_method": order_data.payment_method,
        "payment_status": "pending",
        "shipping_address": order_data.shipping_address,
        "shipping_city": order_data.shipping_city,
        "shipping_phone": order_data.shipping_phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Clear cart
    await db.cart.delete_many({"user_id": user["id"]})
    
    del order_doc["_id"]
    return order_doc

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str = Query(...), request: Request = None):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    return {"message": "Order status updated"}

@api_router.put("/orders/{order_id}/payment")
async def confirm_payment(order_id: str, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"id": order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Simulate payment confirmation (in production, this would verify with payment provider)
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "paid", "status": "confirmed"}}
    )
    return {"message": "Payment confirmed"}

# ==================== IMAGE UPLOAD ROUTES ====================
@api_router.post("/upload")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    path = f"{APP_NAME}/products/{uuid.uuid4()}.{ext}"
    data = await file.read()
    
    result = put_object(path, data, file.content_type or "application/octet-stream")
    
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}

@api_router.get("/files/{path:path}")
async def get_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type))

# ==================== CATEGORIES ROUTES ====================
@api_router.get("/categories")
async def get_categories():
    categories = [
        {"id": "robes", "name": "Robes", "image": "https://images.unsplash.com/photo-1762605135332-8a7ce1403187?w=400"},
        {"id": "tops", "name": "Tops", "image": "https://images.pexels.com/photos/20837265/pexels-photo-20837265.jpeg?w=400"},
        {"id": "pantalons", "name": "Pantalons", "image": "https://images.unsplash.com/photo-1769072058710-66381e166f12?w=400"},
        {"id": "jupes", "name": "Jupes", "image": "https://images.pexels.com/photos/7203482/pexels-photo-7203482.jpeg?w=400"},
        {"id": "ensembles", "name": "Ensembles", "image": "https://images.unsplash.com/photo-1772714601004-23b94ae3913d?w=400"},
        {"id": "accessoires", "name": "Accessoires", "image": "https://images.pexels.com/photos/30562024/pexels-photo-30562024.jpeg?w=400"}
    ]
    return categories

# ==================== STARTUP ====================
@app.on_event("startup")
async def startup():
    # Initialize storage
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index("category")
    await db.cart.create_index([("user_id", 1), ("product_id", 1)])
    await db.favorites.create_index([("user_id", 1), ("product_id", 1)])
    await db.orders.create_index("user_id")
    await db.reviews.create_index([("product_id", 1), ("user_id", 1)])
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@outfitshopci.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    
    # Seed welcome promo code
    existing_promo = await db.promo_codes.find_one({"code": "BIENVENUE10"})
    if not existing_promo:
        await db.promo_codes.insert_one({
            "id": str(uuid.uuid4()),
            "code": "BIENVENUE10",
            "discount_percent": 10,
            "min_purchase": 0,
            "max_uses": 1000,
            "uses": 0,
            "is_active": True,
            "expires_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Welcome promo code created: BIENVENUE10")
    
    # Seed sample products
    products_count = await db.products.count_documents({})
    if products_count == 0:
        sample_products = [
            {
                "id": str(uuid.uuid4()),
                "name": "Robe Élégante Noire",
                "description": "Une robe élégante parfaite pour toutes les occasions. Tissu de haute qualité avec une coupe flatteuse.",
                "price": 35000,
                "original_price": 45000,
                "category": "robes",
                "sizes": ["XS", "S", "M", "L", "XL"],
                "colors": ["Noir", "Rouge", "Bleu Marine"],
                "images": ["https://images.unsplash.com/photo-1762605135332-8a7ce1403187?w=800"],
                "stock": 50,
                "is_featured": True,
                "is_bestseller": True,
                "is_new": False,
                "rating": 4.8,
                "reviews_count": 24,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Ensemble Casual Homme",
                "description": "Ensemble décontracté pour homme moderne. Confortable et stylé.",
                "price": 28000,
                "original_price": None,
                "category": "ensembles",
                "sizes": ["S", "M", "L", "XL", "XXL"],
                "colors": ["Noir", "Gris", "Beige"],
                "images": ["https://images.unsplash.com/photo-1763750581767-b367bcd6c117?w=800"],
                "stock": 30,
                "is_featured": True,
                "is_bestseller": False,
                "is_new": True,
                "rating": 4.5,
                "reviews_count": 12,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Lunettes de Soleil Premium",
                "description": "Lunettes de soleil avec verres UV400. Style moderne et protection optimale.",
                "price": 15000,
                "original_price": 20000,
                "category": "accessoires",
                "sizes": ["Unique"],
                "colors": ["Noir", "Doré", "Argent"],
                "images": ["https://images.unsplash.com/photo-1564347654812-bcc3f3bca7ff?w=800"],
                "stock": 100,
                "is_featured": False,
                "is_bestseller": True,
                "is_new": False,
                "rating": 4.9,
                "reviews_count": 45,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sneakers Tendance",
                "description": "Sneakers confortables pour un look décontracté. Semelle souple et design moderne.",
                "price": 22000,
                "original_price": None,
                "category": "accessoires",
                "sizes": ["38", "39", "40", "41", "42", "43", "44"],
                "colors": ["Blanc", "Noir", "Rose"],
                "images": ["https://images.pexels.com/photos/7203482/pexels-photo-7203482.jpeg?w=800"],
                "stock": 60,
                "is_featured": True,
                "is_bestseller": True,
                "is_new": True,
                "rating": 4.7,
                "reviews_count": 38,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Sac à Main Chic",
                "description": "Sac à main élégant en cuir synthétique de qualité. Parfait pour toutes vos sorties.",
                "price": 18000,
                "original_price": 25000,
                "category": "accessoires",
                "sizes": ["Unique"],
                "colors": ["Beige", "Noir", "Marron"],
                "images": ["https://images.pexels.com/photos/30562024/pexels-photo-30562024.jpeg?w=800"],
                "stock": 40,
                "is_featured": False,
                "is_bestseller": False,
                "is_new": True,
                "rating": 4.6,
                "reviews_count": 15,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Top Fashion Femme",
                "description": "Top tendance pour femme moderne. Tissu léger et confortable.",
                "price": 12000,
                "original_price": None,
                "category": "tops",
                "sizes": ["XS", "S", "M", "L"],
                "colors": ["Blanc", "Noir", "Rose"],
                "images": ["https://images.pexels.com/photos/20837265/pexels-photo-20837265.jpeg?w=800"],
                "stock": 80,
                "is_featured": True,
                "is_bestseller": True,
                "is_new": False,
                "rating": 4.4,
                "reviews_count": 28,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pantalon Classique",
                "description": "Pantalon classique coupe droite. Idéal pour le bureau ou les sorties.",
                "price": 20000,
                "original_price": 28000,
                "category": "pantalons",
                "sizes": ["36", "38", "40", "42", "44"],
                "colors": ["Noir", "Gris", "Bleu Marine"],
                "images": ["https://images.unsplash.com/photo-1769072058710-66381e166f12?w=800"],
                "stock": 45,
                "is_featured": False,
                "is_bestseller": False,
                "is_new": True,
                "rating": 4.3,
                "reviews_count": 19,
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Jupe Plissée",
                "description": "Jupe plissée élégante. Parfaite pour un look féminin et raffiné.",
                "price": 16000,
                "original_price": None,
                "category": "jupes",
                "sizes": ["XS", "S", "M", "L"],
                "colors": ["Noir", "Beige", "Rose Poudré"],
                "images": ["https://images.pexels.com/photos/7203482/pexels-photo-7203482.jpeg?w=800"],
                "stock": 35,
                "is_featured": True,
                "is_bestseller": False,
                "is_new": True,
                "rating": 4.5,
                "reviews_count": 22,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        await db.products.insert_many(sample_products)
        logger.info(f"Seeded {len(sample_products)} sample products")
    
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Test User
- Email: test@example.com
- Password: Test123!
- Role: user

## Promo Code
- Code: BIENVENUE10
- Discount: 10%

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
""")
    logger.info("Test credentials written to /app/memory/test_credentials.md")

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
