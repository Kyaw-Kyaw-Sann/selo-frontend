# Selo Backend API Reference

Updated: **2026-11-14**

လက်ရှိ `src/app.ts`, routes/controllers/services/repositories/schemas ကို အခြေခံတဲ့ implemented API reference ဖြစ်ပါတယ်။ Roadmap ထဲက မပြီးသေးတဲ့ endpoints တွေကို working APIs အဖြစ် မဖော်ပြထားပါ။

**Coverage: `/api` endpoints 35 ခု + `GET /health` 1 ခု = explicit endpoints 36 ခု။** CORS preflight `OPTIONS` ကို middleware က handle လုပ်ပြီး business endpoint အဖြစ် မရေတွက်ပါ။

**Examples ရဲ့ အဓိပ္ပာယ်:** “Captured GET response” ဆိုတာ လက်ရှိ local database ကို temporary server ကနေ GET ခေါ်ပြီး ရရှိတဲ့ snapshot ဖြစ်ပါတယ်။ အခြား success examples တွေက code-derived examples ဖြစ်ပြီး POST/PATCH ကို documentation ရေးဖို့ execute မလုပ်ထားပါ။ IDs, names, stock, timestamps, totals နဲ့ pagination counts က database အပြောင်းအလဲအလိုက် ကွာနိုင်ပါတယ်။ Examples တစ်ခုချင်းစီက independent ဖြစ်ပြီး ဖိုင်အပေါ်မှအောက်အထိ run လုပ်ရမယ့် seed script မဟုတ်ပါ။

## Connection & common conventions

```text
Backend origin: http://localhost:3000
API base URL:   http://localhost:3000/api
Frontend:      http://localhost:5173 (FRONTEND_ORIGIN setting)
```

Protected endpoints မှာ login ရပြီးသား `selo_token` cookie လိုပါတယ်။ Browser requests မှာ `credentials: "include"` (Axios မှာ `withCredentials: true`) သုံးပါ။ Bruno မှာ cookie jar ကို enable ထားပါ။ JWT ကို response JSON/localStorage ထဲကနေ ရယူသုံးဖို့ မလိုပါ။ Cookie က HttpOnly, SameSite=Strict, Path=/; Secure က production မှာ true; login expiry က 1 hour ဖြစ်ပါတယ်။

`/api` အောက်က POST/PATCH requests အားလုံး (login/logout အပါအဝင်) မှာ ဒီ header လိုပါတယ်။ GET/HEAD/OPTIONS မှာ မလိုပါ။ Header က CSRF guard ဖြစ်ပြီး authentication အစားထိုးမဟုတ်ပါ။

```http
Content-Type: application/json
X-Selo-Request: 1
```

Header အမှန်က **X-Selo-Request** ဖြစ်ပြီး **X-Selo_Request** မဟုတ်ပါ။ Body မရှိတဲ့ logout မှာ Content-Type မလိုပါ။ CORS origin က configured frontend origin ဖြစ်ပြီး credentialed requests ကို ခွင့်ပြုပါတယ်။

| Data | JSON representation |
| --- | --- |
| IDs / foreign keys | Positive decimal string; maximum `9223372036854775807` |
| Money | Decimal string, e.g. `"4800.00"`; MMK |
| Base reference cost | Decimal string with 6 fractional digits, e.g. `"480.000000"` |
| Quantities / conversion factors / points | Integer number |
| Active flags | Boolean `true` / `false` |
| Timestamps | UTC ISO string, e.g. `2026-11-14T04:30:00.000Z` |
| Missing optional DB values | `null`, where the field is nullable |

`page` default `1`, range `1–1000000`; `limit` default `10`, range `1–100`။ `pagination.total` က filter ကိုက်တဲ့ records အရေအတွက်ဖြစ်ပြီး `totalPages = ceil(total / limit)` ဖြစ်ပါတယ်။

Date filters က `YYYY-MM-DD` UTC date ကို ယူပါတယ်။ `from` က အဲဒီနေ့ 00:00 UTC မှစပြီး `to` က အဲဒီနေ့အဆုံးအထိ ပါဝင်ပါတယ်။ Myanmar local calendar day နဲ့ UTC day က မတူတာကို frontend မှာ သတိပြုပါ။ Sorting က list တိုင်း descending ID၊ purchases/sales/movements မှာ timestamp DESC ပြီး ID DESC ဖြစ်ပါတယ်။ Product units က conversion factor, ID ascending ဖြစ်ပါတယ်။

Success envelope က `success`, `message`, `data` ဖြစ်ပြီး paginated list မှာ `pagination` ထပ်ပါပါတယ်။ Empty list က HTTP 200 နဲ့ အောက်ပါအတိုင်း ဖြစ်ပါတယ်—

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Error envelope မှာ `data`/`pagination` မပါပါ။ HTTP status နဲ့ `code` ကို frontend logic အတွက် သုံးပါ။ Message စာသားကို code အစား မသုံးပါ။ Validation က first issue message တစ်ခုကိုပဲ ပြန်ပေးပြီး field-errors array မပါပါ။ Zod default messages က custom validation messages နဲ့ ကွာနိုင်ပါတယ်။

## Endpoint index

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/health` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Both |
| POST | `/api/auth/logout` | Both |
| GET | `/api/users` | Owner |
| GET | `/api/users/:id` | Owner |
| POST | `/api/users` | Owner |
| PATCH | `/api/users/:id` | Owner |
| PATCH | `/api/users/:id/status` | Owner |
| GET | `/api/units` | Both |
| POST | `/api/units` | Owner |
| PATCH | `/api/units/:id` | Owner |
| PATCH | `/api/units/:id/status` | Owner |
| GET | `/api/categories` | Both |
| POST | `/api/categories` | Owner |
| PATCH | `/api/categories/:id` | Owner |
| PATCH | `/api/categories/:id/status` | Owner |
| GET | `/api/products` | Both |
| GET | `/api/products/:id` | Both |
| POST | `/api/products` | Owner |
| PATCH | `/api/products/:id` | Owner |
| PATCH | `/api/products/:id/status` | Owner |
| GET | `/api/suppliers` | Owner |
| GET | `/api/suppliers/:id` | Owner |
| POST | `/api/suppliers` | Owner |
| PATCH | `/api/suppliers/:id` | Owner |
| PATCH | `/api/suppliers/:id/status` | Owner |
| GET | `/api/inventory` | Both |
| GET | `/api/inventory/movements` | Owner |
| GET | `/api/inventory/movements/:id` | Owner |
| POST | `/api/inventory/adjustments` | Owner |
| GET | `/api/purchases` | Owner |
| GET | `/api/purchases/:id` | Owner |
| POST | `/api/purchases` | Owner |
| GET | `/api/sales` | Both |
| GET | `/api/sales/:id` | Both |

`Both` = OWNER/CASHIER; `Owner` = OWNER only; `Public` = login cookie မလို။ Endpoint error tables အပြင် Common errors ကလည်း သက်ဆိုင်ပါတယ်။

## Health

### >>> GET /health

**Access:** Public

```http
GET http://localhost:3000/health
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Server is healthy",
  "data": null
}
```

**Notes**

API base `/api` အောက်မှာ မဟုတ်ပါ။ ဒီ handler က database health query မလုပ်ပါ။ Common CSRF middleware ကလည်း ဒီ route ကို မစစ်ပါ။

**Errors:** ဒီ health handler မှာ custom error branch မရှိပါ။

---

## Authentication

### >>> POST /api/auth/login

**Access:** Public

```http
POST http://localhost:3000/api/auth/login
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "username": "owner",
  "password": "<your-owner-password>"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| username | Yes | String; trim; 1–80 characters |
| password | Yes | Nonempty string; login schema က trim မလုပ်ပါ |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "1",
    "name": "Store Owner",
    "username": "owner",
    "role": "OWNER"
  }
}
```

**Notes**

`<your-owner-password>` ကို ကိုယ့် password အမှန်နဲ့ အစားထိုးပါ။ Login cookie မလိုပေမယ့် `X-Selo-Request: 1` လိုပါတယ်။ Success မှာ `Set-Cookie: selo_token=...` ရပြီး JWT ကို JSON ထဲ မပြန်ပေးပါ။ Disabled account ကလည်း `INVALID_CREDENTIALS` ပြန်ပါတယ်။

**Error response — 401**

```json
{
  "success": false,
  "message": "Invalid username or password",
  "code": "INVALID_CREDENTIALS"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `INVALID_CREDENTIALS` | Invalid username or password |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/auth/me

**Access:** Both

```http
GET http://localhost:3000/api/auth/me
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "id": "1",
    "name": "Store Owner",
    "username": "owner",
    "role": "OWNER"
  }
}
```

**Notes**

Request body မလိုပါ။ Login cookie ပို့ပေးရပါမယ်။ `data` မှာ `id`, `name`, `username`, `role` ပဲ ပါပါတယ်။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/auth/logout

**Access:** Both

```http
POST http://localhost:3000/api/auth/logout
X-Selo-Request: 1
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Notes**

Request body မလိုပါ။ Cookie နဲ့ CSRF header လိုပါတယ်။ Success က browser cookie ကို clear လုပ်ပေးတာဖြစ်ပြီး server-side token blacklist မရှိပါ။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Users

### >>> GET /api/users

**Access:** Owner

```http
GET http://localhost:3000/api/users?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Name/username contains; default empty; max 150 characters |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "9",
      "name": "Zaw Lin",
      "username": "demo.zaw",
      "role": "CASHIER",
      "isActive": false
    },
    {
      "id": "8",
      "name": "May Thu",
      "username": "demo.may",
      "role": "CASHIER",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 9,
    "totalPages": 5
  }
}
```

**Error response — 403**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 403 | `FORBIDDEN` | Permission denied |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/users/:id

**Access:** Owner

```http
GET http://localhost:3000/api/users/3
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "3",
    "name": "Cashier 2",
    "username": "cashier2",
    "role": "CASHIER",
    "isActive": true
  }
}
```

**Error response — 404**

```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `USER_NOT_FOUND` | User not found |
| 400 | `VALIDATION_ERROR` | Invalid user ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/users

**Access:** Owner

```http
POST http://localhost:3000/api/users
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Reference Cashier",
  "username": "reference.cashier",
  "password": "ExampleCashier123!",
  "role": "CASHIER"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | Yes | Trimmed string; 1–150 characters |
| username | Yes | Trimmed string; 1–80 characters; unique |
| password | Yes | At least 8 characters; UTF-8 length at most 72 bytes |
| role | Yes | OWNER or CASHIER |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "1001",
    "name": "Reference Cashier",
    "username": "reference.cashier",
    "role": "CASHIER",
    "isActive": true
  }
}
```

**Notes**

Password/hash ကို response ထဲ မပါစေပါ။ Example password က account အသစ်အတွက် sample သာဖြစ်ပါတယ်။

**Error response — 409**

```json
{
  "success": false,
  "message": "Username already exists",
  "code": "USERNAME_EXISTS"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `USERNAME_EXISTS` | Username already exists |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/users/:id

**Access:** Owner

```http
PATCH http://localhost:3000/api/users/3
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Updated Cashier"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | No | Trimmed string; 1–150 characters |
| username | No | Trimmed string; 1–80 characters; unique |
| role | No | OWNER or CASHIER |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "3",
    "name": "Updated Cashier",
    "username": "cashier2",
    "role": "CASHIER",
    "isActive": true
  }
}
```

**Notes**

အနည်းဆုံး field တစ်ခုလိုပါတယ်။ Password update field မရှိပါ။ နောက်ဆုံး active owner ကို CASHIER ပြောင်းလို့မရပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `USER_NOT_FOUND` | User not found |
| 409 | `USERNAME_EXISTS` | Username already exists |
| 409 | `LAST_ACTIVE_OWNER` | At least one active owner must remain |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid user ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/users/:id/status

**Access:** Owner

```http
PATCH http://localhost:3000/api/users/3/status
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "isActive": false
}
```

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "id": "3",
    "name": "Cashier 2",
    "username": "cashier2",
    "role": "CASHIER",
    "isActive": false
  }
}
```

**Notes**

`isActive` က required Boolean ဖြစ်ပါတယ်။ နောက်ဆုံး active owner ကို deactivate လုပ်လို့မရပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `USER_NOT_FOUND` | User not found |
| 409 | `LAST_ACTIVE_OWNER` | At least one active owner must remain |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid user ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Units

### >>> GET /api/units

**Access:** Both

```http
GET http://localhost:3000/api/units?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Name/code contains; default empty; max 80 characters |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Units retrieved successfully",
  "data": [
    {
      "id": "24",
      "name": "Bar",
      "code": "bar",
      "isActive": true
    },
    {
      "id": "23",
      "name": "Bag",
      "code": "bag",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 7,
    "totalPages": 4
  }
}
```

**Notes**

`status` filter မရှိပါ။ Active/inactive units နှစ်မျိုးလုံး list ထဲ ပါနိုင်ပါတယ်။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/units

**Access:** Owner

```http
POST http://localhost:3000/api/units
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Reference Piece",
  "code": "ref-pcs"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | Yes | Trimmed string; 1–80 characters |
| code | Yes | Trimmed string; 1–30 characters; unique |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Unit created successfully",
  "data": {
    "id": "1002",
    "name": "Reference Piece",
    "code": "ref-pcs",
    "isActive": true
  }
}
```

**Error response — 409**

```json
{
  "success": false,
  "message": "Unit code already exists",
  "code": "UNIT_CODE_EXISTS"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `UNIT_CODE_EXISTS` | Unit code already exists |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/units/:id

**Access:** Owner

```http
PATCH http://localhost:3000/api/units/19
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Updated Unit"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | No | Trimmed string; 1–80 characters |
| code | No | Trimmed string; 1–30 characters; unique |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Unit updated successfully",
  "data": {
    "id": "19",
    "name": "Updated Unit",
    "code": "sachet",
    "isActive": true
  }
}
```

**Notes**

အနည်းဆုံး field တစ်ခုလိုပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Unit not found",
  "code": "UNIT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `UNIT_NOT_FOUND` | Unit not found |
| 409 | `UNIT_CODE_EXISTS` | Unit code already exists |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid unit ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/units/:id/status

**Access:** Owner

```http
PATCH http://localhost:3000/api/units/19/status
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "isActive": false
}
```

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Unit status updated successfully",
  "data": {
    "id": "19",
    "name": "Sachet",
    "code": "sachet",
    "isActive": false
  }
}
```

**Notes**

`isActive` က required Boolean ဖြစ်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Unit not found",
  "code": "UNIT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `UNIT_NOT_FOUND` | Unit not found |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid unit ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Categories

### >>> GET /api/categories

**Access:** Both

```http
GET http://localhost:3000/api/categories?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "17",
      "name": "Household",
      "parentId": null,
      "isActive": true,
      "children": [
        {
          "id": "18",
          "name": "Cleaning Supplies",
          "parentId": "17",
          "isActive": true
        }
      ]
    },
    {
      "id": "14",
      "name": "Groceries",
      "parentId": null,
      "isActive": true,
      "children": [
        {
          "id": "15",
          "name": "Biscuits & Snacks",
          "parentId": "14",
          "isActive": true
        },
        {
          "id": "16",
          "name": "Rice & Sugar",
          "parentId": "14",
          "isActive": true
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 5,
    "totalPages": 3
  }
}
```

**Notes**

Pagination က root categories ကိုပဲ ရေတွက်ပါတယ်။ Root တစ်ခုစီမှာ `children` array ပါပြီး child မှာ နောက်ထပ် `children` field မပါပါ။ `search`/`status` filters မရှိပါ။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/categories

**Access:** Owner

```http
POST http://localhost:3000/api/categories
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Reference Snacks",
  "parentId": "17"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | Yes | Trimmed string; 1–150 characters |
| parentId | No | ID string or null; default null |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "1003",
    "name": "Reference Snacks",
    "parentId": "17",
    "isActive": true
  }
}
```

**Notes**

Root category အတွက် `parentId` ကို မပို့ဘဲထားနိုင်သလို `null` ပို့နိုင်ပါတယ်။ Child category ကို parent အဖြစ် ထပ်ရွေးလို့မရပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "Parent category not found",
  "code": "PARENT_CATEGORY_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PARENT_CATEGORY_NOT_FOUND` | Parent category not found |
| 409 | `CATEGORY_DEPTH_EXCEEDED` | Category hierarchy cannot exceed two levels |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/categories/:id

**Access:** Owner

```http
PATCH http://localhost:3000/api/categories/17
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Updated Category"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | No | Trimmed string; 1–150 characters |
| parentId | No | ID string or null |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "17",
    "name": "Updated Category",
    "parentId": null,
    "isActive": true
  }
}
```

**Notes**

အနည်းဆုံး field တစ်ခုလိုပါတယ်။ `parentId: null` က root ပြောင်းတာဖြစ်ပါတယ်။ Children ရှိတဲ့ root ကို တခြား category အောက် ရွှေ့လို့မရပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "Category not found",
  "code": "CATEGORY_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `CATEGORY_NOT_FOUND` | Category not found |
| 404 | `PARENT_CATEGORY_NOT_FOUND` | Parent category not found |
| 409 | `CATEGORY_SELF_PARENT` | Category cannot be its own parent |
| 409 | `CATEGORY_DEPTH_EXCEEDED` | Category hierarchy cannot exceed two levels |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid category ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/categories/:id/status

**Access:** Owner

```http
PATCH http://localhost:3000/api/categories/17/status
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "isActive": false
}
```

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Category status updated successfully",
  "data": {
    "id": "17",
    "name": "Household",
    "parentId": null,
    "isActive": false
  }
}
```

**Notes**

`isActive` က required Boolean ဖြစ်ပါတယ်။ ဒီ endpoint က ရွေးထားတဲ့ category ကိုပဲ update လုပ်ပါတယ်; children/products ကို cascade deactivate မလုပ်ပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "Category not found",
  "code": "CATEGORY_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `CATEGORY_NOT_FOUND` | Category not found |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid category ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Products

### >>> GET /api/products

**Access:** Both

```http
GET http://localhost:3000/api/products?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Product name/SKU contains OR exact product-unit barcode; max 200 characters |
| categoryId | No | Exact category ID; descendant categories ကို အလိုအလျောက် မပေါင်းပါ |
| status | No | ALL (default), ACTIVE, INACTIVE |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "18",
      "sku": "DEMO-SOP-001",
      "name": "Laundry Soap 200g",
      "categoryId": "18",
      "baseUnitId": "24",
      "imagePath": null,
      "stockQuantity": 68,
      "minStockLevel": 18,
      "isActive": true
    },
    {
      "id": "17",
      "sku": "DEMO-SUG-001",
      "name": "White Sugar 1kg",
      "categoryId": "16",
      "baseUnitId": "23",
      "imagePath": null,
      "stockQuantity": 0,
      "minStockLevel": 10,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 9,
    "totalPages": 5
  }
}
```

**Notes**

List response ထဲမှာ product units၊ selling prices နဲ့ cost မပါပါ။ Units/prices အတွက် product detail ကိုခေါ်ပါ။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/products/:id

**Access:** Both

```http
GET http://localhost:3000/api/products/11
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "11",
    "sku": "DEMO-COF-001",
    "name": "3-in-1 Coffee Mix",
    "categoryId": "12",
    "categoryName": "Coffee & Tea",
    "baseUnitId": "19",
    "baseUnitName": "Sachet",
    "baseUnitCode": "sachet",
    "imagePath": null,
    "stockQuantity": 307,
    "minStockLevel": 30,
    "isActive": true,
    "latestPurchaseCost": "420.000000",
    "units": [
      {
        "id": "15",
        "unitId": "19",
        "unitName": "Sachet",
        "unitCode": "sachet",
        "conversionFactor": 1,
        "barcode": "DEMO-COF-001-SACHET",
        "sellingPrice": "500.00",
        "canPurchase": true,
        "canSell": true,
        "isActive": true
      },
      {
        "id": "16",
        "unitId": "20",
        "unitName": "Pack",
        "unitCode": "pack",
        "conversionFactor": 10,
        "barcode": "DEMO-COF-001-PACK",
        "sellingPrice": "4800.00",
        "canPurchase": true,
        "canSell": true,
        "isActive": true
      },
      {
        "id": "17",
        "unitId": "21",
        "unitName": "Carton",
        "unitCode": "carton",
        "conversionFactor": 100,
        "barcode": "DEMO-COF-001-CARTON",
        "sellingPrice": "46000.00",
        "canPurchase": true,
        "canSell": true,
        "isActive": true
      }
    ]
  }
}
```

**Notes**

ဒီ captured example က Owner response ဖြစ်ပါတယ်။ Cashier response မှာ `latestPurchaseCost` field ကို ဖယ်ထားပါတယ်။ `units[].id` က product-unit ID; `units[].unitId` က shared-unit ID ဖြစ်ပါတယ်။ `units[].isActive` က product-unit flag ဖြစ်ပြီး shared unit ရဲ့ active flag သီးခြားမပါပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PRODUCT_NOT_FOUND` | Product not found |
| 400 | `VALIDATION_ERROR` | Invalid product ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/products

**Access:** Owner

```http
POST http://localhost:3000/api/products
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "sku": "REF-COF-001",
  "name": "Reference Coffee Mix",
  "categoryId": "12",
  "baseUnitId": "19",
  "imagePath": null,
  "minStockLevel": 20,
  "units": [
    {
      "unitId": "19",
      "conversionFactor": 1,
      "barcode": "REF-COF-001-BASE",
      "sellingPrice": "500.00",
      "canSell": true,
      "canPurchase": true
    }
  ]
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| sku | Yes | Trimmed string; 1–80 characters; unique |
| name | Yes | Trimmed string; 1–200 characters |
| categoryId | No | ID string or null; default null |
| baseUnitId | Yes | Shared-unit ID string |
| imagePath | No | Trimmed string 1–500 characters or null; default null |
| minStockLevel | No | Integer 0–2147483647; default 0 |
| units | Yes | Array of 1–3 product-unit objects |
| units[].unitId | Yes | Shared-unit ID string; no duplicate unit IDs |
| units[].conversionFactor | Yes | Integer 1–2147483647; base unit must be 1 |
| units[].sellingPrice | Yes | Nonnegative decimal string; up to 16 integer digits and 2 fractional digits |
| units[].barcode | No | Trimmed string 1–100 characters or null; default null; unique if set |
| units[].canSell / canPurchase | No | Boolean; each defaults true |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "1004"
  }
}
```

**Notes**

Base unit ကို `units` ထဲ ထည့်ရပါမယ်။ `canSell: true` ဆို selling price > 0 လိုပါတယ်။ Stock/latest cost ကို ဒီ payload ကနေ မသတ်မှတ်နိုင်ပါ။ `imagePath` က string field သာဖြစ်ပြီး upload endpoint မရှိပါ။ Success မှာ `{ id }` ပဲ ပြန်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Category not found",
  "code": "CATEGORY_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `CATEGORY_NOT_FOUND` | Category not found |
| 409 | `CATEGORY_INACTIVE` | Category is inactive |
| 404 | `UNIT_NOT_FOUND` | Unit not found |
| 409 | `UNIT_INACTIVE` | Unit is inactive |
| 409 | `PRODUCT_SKU_EXISTS` | SKU already exists |
| 409 | `BARCODE_EXISTS` | Barcode already exists |
| 409 | `PRODUCT_CONFLICT` | Product data conflicts with an existing record |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/products/:id

**Access:** Owner

```http
PATCH http://localhost:3000/api/products/11
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Updated Coffee Mix",
  "minStockLevel": 25,
  "units": [
    {
      "unitId": "19",
      "sellingPrice": "550.00"
    }
  ]
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| sku / name / categoryId / imagePath / minStockLevel | No | Same value rules as create; at least one top-level field |
| baseUnitId | No | Current base-unit ID ပဲ လက်ခံပါတယ် |
| units | No | Array of 1–3 updates; unitId မထပ်ရပါ |
| units[].unitId | Yes within each item | Shared-unit ID; product-unit ID မဟုတ်ပါ |
| units[].conversionFactor / sellingPrice / barcode / canSell / canPurchase | No for existing units | Same value rules as create |
| units[].isActive | No | Boolean |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": "11"
  }
}
```

**Notes**

Units payload က merge/update ဖြစ်ပါတယ်; မပို့တဲ့ existing units ကို မဖျက်ပါ။ New unit ထည့်ရင် `conversionFactor` နဲ့ `sellingPrice` လိုပြီး စုစုပေါင်း units ၃ ခုထက် မကျော်ရပါ။ Purchase/sale history ရှိတဲ့ unit ရဲ့ conversion factor ပြောင်းလို့မရပါ။ `barcode: null` နဲ့ barcode ဖယ်နိုင်ပါတယ်။ Success မှာ `{ id }` ပဲ ပြန်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PRODUCT_NOT_FOUND` | Product not found |
| 409 | `BASE_UNIT_IMMUTABLE` | Base unit cannot be changed |
| 404 | `CATEGORY_NOT_FOUND` | Category not found |
| 409 | `CATEGORY_INACTIVE` | Category is inactive |
| 409 | `PRODUCT_UNIT_LIMIT` | A product can have at most three units |
| 404 | `UNIT_NOT_FOUND` | Unit not found |
| 409 | `UNIT_INACTIVE` | Unit is inactive |
| 409 | `BASE_UNIT_CONVERSION` | Base unit must keep conversion factor 1 |
| 409 | `UNIT_CONVERSION_IN_USE` | Used unit conversion cannot be changed |
| 409 | `PRODUCT_SKU_EXISTS` | SKU already exists |
| 409 | `BARCODE_EXISTS` | Barcode already exists |
| 409 | `PRODUCT_CONFLICT` | Product data conflicts with an existing record |
| 400 | `VALIDATION_ERROR` | New units require conversionFactor and sellingPrice |
| 400 | `VALIDATION_ERROR` | Sellable units must have a positive selling price |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/products/:id/status

**Access:** Owner

```http
PATCH http://localhost:3000/api/products/11/status
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "isActive": false
}
```

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Product status updated successfully",
  "data": {
    "id": "11",
    "isActive": false
  }
}
```

**Notes**

`isActive` က required Boolean ဖြစ်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PRODUCT_NOT_FOUND` | Product not found |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid product ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Suppliers

### >>> GET /api/suppliers

**Access:** Owner

```http
GET http://localhost:3000/api/suppliers?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Name/phone/contact-person contains; max 200 characters |
| status | No | ALL (default), ACTIVE, INACTIVE |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Suppliers retrieved successfully",
  "data": [
    {
      "id": "2",
      "name": "Updated Shwe Mandalay Trading",
      "phone": "09123456789",
      "contactPerson": "U Aung Min",
      "isActive": false
    },
    {
      "id": "1",
      "name": "Shwe Mandalay Trading",
      "phone": "09123456789",
      "contactPerson": "U Aung Min",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 2,
    "totalPages": 1
  }
}
```

**Error response — 403**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 403 | `FORBIDDEN` | Permission denied |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/suppliers/:id

**Access:** Owner

```http
GET http://localhost:3000/api/suppliers/1
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Supplier retrieved successfully",
  "data": {
    "id": "1",
    "name": "Shwe Mandalay Trading",
    "phone": "09123456789",
    "contactPerson": "U Aung Min",
    "address": "Mandalay",
    "notes": "Coffee, tea and snack supplier",
    "isActive": true
  }
}
```

**Error response — 404**

```json
{
  "success": false,
  "message": "Supplier not found",
  "code": "SUPPLIER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `SUPPLIER_NOT_FOUND` | Supplier not found |
| 400 | `VALIDATION_ERROR` | Invalid supplier ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/suppliers

**Access:** Owner

```http
POST http://localhost:3000/api/suppliers
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Reference Mandalay Trading",
  "phone": "09900000123",
  "contactPerson": "U Min",
  "address": "Mandalay",
  "notes": "Coffee and snack supplier"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name | Yes | Trimmed string; 1–200 characters |
| phone | No | Trimmed string 1–40 characters or null; default null |
| contactPerson | No | Trimmed string 1–150 characters or null; default null |
| address / notes | No | Trimmed string 1–5000 characters or null; default null |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Supplier created successfully",
  "data": {
    "id": "1005",
    "name": "Reference Mandalay Trading",
    "phone": "09900000123",
    "contactPerson": "U Min",
    "address": "Mandalay",
    "notes": "Coffee and snack supplier",
    "isActive": true
  }
}
```

**Notes**

Optional blank fields အတွက် `null` သို့မဟုတ် omit သုံးပါ; empty string မသုံးပါ။ Supplier name/phone uniqueness ကို လက်ရှိ implementation က မသတ်မှတ်ပါ။ Common validation errors လည်း သက်ဆိုင်ပါတယ်။

**Error response — 403**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 403 | `FORBIDDEN` | Permission denied |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/suppliers/:id

**Access:** Owner

```http
PATCH http://localhost:3000/api/suppliers/1
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "name": "Updated Trading",
  "phone": null,
  "address": "Yangon"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| name / phone / contactPerson / address / notes | No | Same value rules as create; at least one field |

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Supplier updated successfully",
  "data": {
    "id": "1",
    "name": "Updated Trading",
    "phone": null,
    "contactPerson": "U Aung Min",
    "address": "Yangon",
    "notes": "Coffee, tea and snack supplier",
    "isActive": true
  }
}
```

**Notes**

မပို့တဲ့ fields မပြောင်းပါ။ Nullable fields တွေကို `null` နဲ့ clear လုပ်နိုင်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Supplier not found",
  "code": "SUPPLIER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `SUPPLIER_NOT_FOUND` | Supplier not found |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid supplier ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> PATCH /api/suppliers/:id/status

**Access:** Owner

```http
PATCH http://localhost:3000/api/suppliers/1/status
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "isActive": false
}
```

**Response — 200 OK**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Supplier status updated successfully",
  "data": {
    "id": "1",
    "name": "Shwe Mandalay Trading",
    "phone": "09123456789",
    "contactPerson": "U Aung Min",
    "address": "Mandalay",
    "notes": "Coffee, tea and snack supplier",
    "isActive": false
  }
}
```

**Notes**

`isActive` က required Boolean ဖြစ်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Supplier not found",
  "code": "SUPPLIER_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `SUPPLIER_NOT_FOUND` | Supplier not found |
| 400 | `VALIDATION_ERROR` | First schema issue message |
| 400 | `VALIDATION_ERROR` | Invalid supplier ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Inventory

### >>> GET /api/inventory

**Access:** Both

```http
GET http://localhost:3000/api/inventory?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Product name/SKU contains; max 200 characters |
| status | No | ALL (default), LOW_STOCK, OUT_OF_STOCK, IN_STOCK |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Inventory retrieved successfully",
  "data": [
    {
      "productId": "18",
      "sku": "DEMO-SOP-001",
      "productName": "Laundry Soap 200g",
      "baseUnitId": "24",
      "baseUnitName": "Bar",
      "stockQuantity": 68,
      "minStockLevel": 18,
      "stockStatus": "IN_STOCK",
      "isActive": true
    },
    {
      "productId": "17",
      "sku": "DEMO-SUG-001",
      "productName": "White Sugar 1kg",
      "baseUnitId": "23",
      "baseUnitName": "Bag",
      "stockQuantity": 0,
      "minStockLevel": 10,
      "stockStatus": "OUT_OF_STOCK",
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 9,
    "totalPages": 5
  }
}
```

**Notes**

`OUT_OF_STOCK`: stock = 0; `LOW_STOCK`: 0 < stock <= minimum; `IN_STOCK`: stock > minimum။ Product active/inactive နှစ်မျိုးလုံး ပါနိုင်ပါတယ်။ Stock အားလုံး base units ဖြစ်ပါတယ်။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/inventory/movements

**Access:** Owner

```http
GET http://localhost:3000/api/inventory/movements?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| productId | No | Exact product ID |
| movementType | No | ALL (default), OPENING, PURCHASE, SALE, RETURN, ADJUSTMENT |
| from / to | No | YYYY-MM-DD; from <= to; UTC dates |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Inventory movements retrieved successfully",
  "data": [
    {
      "id": "22",
      "productId": "12",
      "sku": "DEMO-TEA-001",
      "productName": "Instant Milk Tea",
      "baseUnitName": "Sachet",
      "movementType": "SALE",
      "quantityChange": -20,
      "quantityBefore": 258,
      "quantityAfter": 238,
      "referenceType": "SALE_ITEM",
      "referenceId": "11",
      "reason": "Workbench sample checkout",
      "performedBy": "5",
      "performedByName": "Aung Min",
      "createdAt": "2026-11-13T08:13:38.469Z"
    },
    {
      "id": "21",
      "productId": "11",
      "sku": "DEMO-COF-001",
      "productName": "3-in-1 Coffee Mix",
      "baseUnitName": "Sachet",
      "movementType": "SALE",
      "quantityChange": -10,
      "quantityBefore": 317,
      "quantityAfter": 307,
      "referenceType": "SALE_ITEM",
      "referenceId": "10",
      "reason": "Workbench sample checkout",
      "performedBy": "5",
      "performedByName": "Aung Min",
      "createdAt": "2026-11-13T08:13:38.469Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 22,
    "totalPages": 11
  }
}
```

**Notes**

Order က `createdAt DESC`, ပြီးရင် movement ID DESC ဖြစ်ပါတယ်။ `referenceType/referenceId` က purchase/sale item စတဲ့ source row ကို ညွှန်းပါတယ်; purchase/sale header ID နဲ့ မတူပါ။

**Error response — 403**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 403 | `FORBIDDEN` | Permission denied |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/inventory/movements/:id

**Access:** Owner

```http
GET http://localhost:3000/api/inventory/movements/1
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Inventory movement retrieved successfully",
  "data": {
    "id": "1",
    "productId": "11",
    "sku": "DEMO-COF-001",
    "productName": "3-in-1 Coffee Mix",
    "baseUnitName": "Sachet",
    "movementType": "ADJUSTMENT",
    "quantityChange": 50,
    "quantityBefore": 0,
    "quantityAfter": 50,
    "referenceType": "MANUAL",
    "referenceId": null,
    "reason": "Initial counted stock",
    "performedBy": "1",
    "performedByName": "Store Owner",
    "operationKey": "manual:550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-11-11T17:25:15.192Z"
  }
}
```

**Notes**

List ထက် `operationKey` field ထပ်ပါပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Inventory movement not found",
  "code": "MOVEMENT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `MOVEMENT_NOT_FOUND` | Inventory movement not found |
| 400 | `VALIDATION_ERROR` | Invalid movement ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/inventory/adjustments

**Access:** Owner

```http
POST http://localhost:3000/api/inventory/adjustments
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "productId": "11",
  "quantityChange": 5,
  "reason": "Physical count correction",
  "operationKey": "550e8400-e29b-41d4-a716-446655440111"
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| productId | Yes | Product ID string |
| quantityChange | Yes | Nonzero signed integer; -2147483647 to 2147483647; base units |
| reason | Yes | Trimmed string; 1–255 characters |
| operationKey | Yes | UUID string |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Inventory adjusted successfully",
  "data": {
    "id": "1006",
    "productId": "11",
    "quantityChange": 5,
    "quantityBefore": 307,
    "quantityAfter": 312,
    "reason": "Physical count correction",
    "performedBy": "1",
    "operationKey": "manual:550e8400-e29b-41d4-a716-446655440111"
  }
}
```

**Notes**

Negative quantity က stock လျှော့တာဖြစ်ပါတယ်။ Result stock < 0 ကို reject လုပ်ပါတယ်။ Stock update နဲ့ movement insert ကို transaction တစ်ခုထဲ လုပ်ပါတယ်။ Response `operationKey` မှာ `manual:` prefix ပါမယ်။ Same key ထပ်ပို့ရင် purchase replay လို success မပြန်ဘဲ `409 OPERATION_KEY_EXISTS` ဖြစ်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PRODUCT_NOT_FOUND` | Product not found |
| 409 | `INSUFFICIENT_STOCK` | Adjustment would make stock negative |
| 409 | `STOCK_LIMIT_EXCEEDED` | Stock quantity exceeds the supported limit |
| 409 | `OPERATION_KEY_EXISTS` | Operation key has already been used |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Purchases

### >>> GET /api/purchases

**Access:** Owner

```http
GET http://localhost:3000/api/purchases?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Purchase number contains; max 50 characters |
| supplierId | No | Exact supplier ID |
| from / to | No | YYYY-MM-DD; from <= to; UTC dates |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Purchases retrieved successfully",
  "data": [
    {
      "id": "7",
      "purchaseNo": "WB-DEMO-PUR-005",
      "supplierId": "1",
      "supplierName": "Shwe Mandalay Trading",
      "totalAmount": "50400.00",
      "receivedBy": "1",
      "receivedByName": "Store Owner",
      "receivedAt": "2026-11-13T08:13:38.464Z"
    },
    {
      "id": "6",
      "purchaseNo": "WB-DEMO-PUR-004",
      "supplierId": "1",
      "supplierName": "Shwe Mandalay Trading",
      "totalAmount": "234000.00",
      "receivedBy": "1",
      "receivedByName": "Store Owner",
      "receivedAt": "2026-11-13T08:13:38.463Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 6,
    "totalPages": 3
  }
}
```

**Error response — 403**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 403 | `FORBIDDEN` | Permission denied |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/purchases/:id

**Access:** Owner

```http
GET http://localhost:3000/api/purchases/2
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Purchase retrieved successfully",
  "data": {
    "id": "2",
    "purchaseNo": "PUR-22485c6a-dc32-4cca-b960-99463049a0c3",
    "supplierId": "1",
    "supplierName": "Shwe Mandalay Trading",
    "totalAmount": "9600.00",
    "notes": "Weekly coffee stock receiving",
    "receivedBy": "1",
    "receivedByName": "Store Owner",
    "receivedAt": "2026-11-13T06:30:21.472Z",
    "createdAt": "2026-11-13T06:30:21.472Z",
    "items": [
      {
        "id": "2",
        "productId": "11",
        "productUnitId": "16",
        "productName": "3-in-1 Coffee Mix",
        "unitName": "Pack",
        "quantity": 2,
        "conversionFactor": 10,
        "baseQuantity": 20,
        "unitCost": "4800.00",
        "lineTotal": "9600.00"
      }
    ]
  }
}
```

**Notes**

`supplierId` နဲ့ `supplierName` က null ဖြစ်နိုင်ပါတယ်။ Item name/unit/conversion/cost တွေက receiving အချိန် snapshot ဖြစ်ပါတယ်။

**Error response — 404**

```json
{
  "success": false,
  "message": "Purchase not found",
  "code": "PURCHASE_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `PURCHASE_NOT_FOUND` | Purchase not found |
| 400 | `VALIDATION_ERROR` | Invalid purchase ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> POST /api/purchases

**Access:** Owner

```http
POST http://localhost:3000/api/purchases
X-Selo-Request: 1
Content-Type: application/json
```

**Request**

```json
{
  "supplierId": "1",
  "notes": "Weekly coffee receiving",
  "idempotencyKey": "reference-purchase-001",
  "items": [
    {
      "productUnitId": "16",
      "quantity": 2,
      "unitCost": "4800.00"
    }
  ]
}
```

**Body fields**

| Field | Required | Rules |
| --- | --- | --- |
| supplierId | No | Supplier ID or null; default null |
| notes | No | Trimmed string 1–5000 characters or null; default null |
| idempotencyKey | Yes | Trimmed string; 1–150 characters; sent in JSON body |
| items | Yes | Array of 1–100 lines |
| items[].productUnitId | Yes | Product detail units[].id; shared-unit ID မဟုတ်ပါ |
| items[].quantity | Yes | Integer 1–2147483647; selected unit count |
| items[].unitCost | Yes | Positive decimal string; up to 16 integer digits and 2 fractional digits |

**Response — 201 Created**

Code-derived success example (database mutation မလုပ်ထားပါ):

```json
{
  "success": true,
  "message": "Purchase received successfully",
  "data": {
    "id": "1007",
    "purchaseNo": "PUR-6b740d20-421b-4ec0-a54a-91ce8dbec4b1",
    "totalAmount": "9600.00",
    "receivedAt": "2026-11-14T04:30:00.000Z"
  }
}
```

**Response — 200 OK (same-request retry)**

```json
{
  "success": true,
  "message": "Purchase already received",
  "data": {
    "id": "1007",
    "purchaseNo": "PUR-6b740d20-421b-4ec0-a54a-91ce8dbec4b1",
    "totalAmount": "9600.00",
    "receivedAt": "2026-11-14T04:30:00.000Z"
  }
}
```

**Notes**

ဒီ example မှာ selected unit က `Pack`၊ conversion factor `10` ဖြစ်ပါတယ်။ Total = 2 × 4800 = 9600 MMK; base quantity = 2 × 10 = 20; latest base cost = 4800 / 10 MMK။ Supplier/product/product-unit/shared-unit active ဖြစ်ပြီး unit က canPurchase ဖြစ်ရပါမယ်။

Purchase header/items၊ stock၊ latest base cost နဲ့ movement တွေကို transaction တစ်ခုထဲ သိမ်းပါတယ်။ Same key + same user/supplier/notes/ordered item list ကို retry လုပ်ရင် HTTP 200 နဲ့ same purchase summary ပြန်ပြီး stock ထပ်မတိုးပါ။ Key တူပြီး content ပြောင်းရင် 409 ဖြစ်ပါတယ်။ Line order ပြောင်းတာလည်း current comparison မှာ different request ဖြစ်ပါတယ်။ Duplicate product-unit lines ကို လက်ရှိ schema က ခွင့်ပြုပြီး line တစ်ခုချင်း stock တိုးပါတယ်။ Response မှာ items မပါလို့ လိုရင် GET detail ပြန်ခေါ်ပါ။

**Error response — 409**

```json
{
  "success": false,
  "message": "Idempotency key was used for a different request",
  "code": "IDEMPOTENCY_CONFLICT"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 409 | `IDEMPOTENCY_CONFLICT` | Idempotency key was used for a different request |
| 404 | `SUPPLIER_NOT_FOUND` | Supplier not found |
| 409 | `SUPPLIER_INACTIVE` | Supplier is inactive |
| 404 | `PRODUCT_UNIT_NOT_FOUND` | Product unit not found |
| 404 | `PRODUCT_NOT_FOUND` | Product not found |
| 409 | `PRODUCT_INACTIVE` | Product is inactive |
| 409 | `PURCHASE_UNIT_UNAVAILABLE` | Product unit is unavailable for purchasing |
| 400 | `AMOUNT_LIMIT_EXCEEDED` | Purchase total exceeds the supported limit |
| 400 | `QUANTITY_LIMIT_EXCEEDED` | Base quantity exceeds the supported limit |
| 409 | `STOCK_LIMIT_EXCEEDED` | Receiving would exceed the stock limit |
| 400 | `COST_LIMIT_EXCEEDED` | Base-unit cost exceeds the supported limit |
| 500 | `INTERNAL_SERVER_ERROR` | Failed to retrieve received purchase |
| 400 | `VALIDATION_ERROR` | First schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Sales & Payments

### >>> GET /api/sales

**Access:** Both

```http
GET http://localhost:3000/api/sales?page=1&limit=2
```

**Query parameters**

| Field | Required | Rules |
| --- | --- | --- |
| search | No | Sale number contains; max 50 characters |
| paymentMethod | No | ALL (default), CASH, QR |
| cashierId | No | Exact cashier ID |
| from / to | No | YYYY-MM-DD; from <= to; UTC dates |
| page / limit | No | Common pagination rules |

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Sales retrieved successfully",
  "data": [
    {
      "id": "6",
      "saleNo": "WB-DEMO-SAL-005",
      "cashierId": "5",
      "cashierName": "Aung Min",
      "subtotal": "16300.00",
      "totalPayable": "16300.00",
      "paymentMethod": "CASH",
      "completedAt": "2026-11-13T08:13:38.469Z"
    },
    {
      "id": "5",
      "saleNo": "WB-DEMO-SAL-004",
      "cashierId": "8",
      "cashierName": "May Thu",
      "subtotal": "187200.00",
      "totalPayable": "187200.00",
      "paymentMethod": "QR",
      "completedAt": "2026-11-13T08:13:38.468Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 5,
    "totalPages": 3
  }
}
```

**Notes**

Cashier အတွက် own-sales-only filter ကို server က အလိုအလျောက် မထည့်ပါ။ `paymentMethod` က payment row မရှိရင် null ဖြစ်နိုင်ပါတယ်။

**Error response — 401**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Authentication required |
| 400 | `VALIDATION_ERROR` | First query schema issue message |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

### >>> GET /api/sales/:id

**Access:** Both

```http
GET http://localhost:3000/api/sales/2
```

**Request**

Request body မလိုပါ။

**Response — 200 OK**

Captured GET response (local database snapshot):

```json
{
  "success": true,
  "message": "Sale retrieved successfully",
  "data": {
    "id": "2",
    "saleNo": "WB-DEMO-SAL-001",
    "cashierId": "5",
    "cashierName": "Aung Min",
    "subtotal": "2700.00",
    "totalPayable": "2700.00",
    "completedAt": "2026-11-13T08:13:38.465Z",
    "createdAt": "2026-11-13T08:13:38.465Z",
    "payment": {
      "id": "1",
      "method": "CASH",
      "amount": "2700.00",
      "tenderedAmount": "4000.00",
      "changeAmount": "1300.00",
      "referenceNo": null,
      "confirmedBy": "5",
      "confirmedAt": "2026-11-13T08:13:38.465Z"
    },
    "items": [
      {
        "id": "2",
        "productId": "11",
        "productUnitId": "15",
        "productName": "3-in-1 Coffee Mix",
        "unitName": "Sachet",
        "quantity": 3,
        "conversionFactor": 1,
        "baseQuantity": 3,
        "unitPrice": "500.00",
        "lineTotal": "1500.00",
        "unitCostSnapshot": "420.000000"
      },
      {
        "id": "3",
        "productId": "12",
        "productUnitId": "18",
        "productName": "Instant Milk Tea",
        "unitName": "Sachet",
        "quantity": 2,
        "conversionFactor": 1,
        "baseQuantity": 2,
        "unitPrice": "600.00",
        "lineTotal": "1200.00",
        "unitCostSnapshot": "490.000000"
      }
    ]
  }
}
```

**Notes**

ဒီ captured example က Owner response ဖြစ်ပါတယ်။ Cashier response မှာ item တစ်ခုစီရဲ့ `unitCostSnapshot` ကို ဖယ်ထားပါတယ်။ Payment row မရှိရင် `payment: null`; QR မှာ `tenderedAmount: null` ဖြစ်နိုင်ပါတယ်။ Items က original sale snapshots ဖြစ်ပါတယ်။ Customer/loyalty fields ကို current detail response က မထည့်ပါ။

**Error response — 404**

```json
{
  "success": false,
  "message": "Sale not found",
  "code": "SALE_NOT_FOUND"
}
```

**Endpoint errors**

| HTTP | Code | Message |
| --- | --- | --- |
| 404 | `SALE_NOT_FOUND` | Sale not found |
| 400 | `VALIDATION_ERROR` | Invalid sale ID |

Common authentication/permission/CSRF/validation/internal errors ကိုလည်း အောက်မှာ ကြည့်ပါ။

---

## Common errors

**401 UNAUTHENTICATED — Protected request မှာ cookie မရှိ**

```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHENTICATED"
}
```

**401 UNAUTHENTICATED — Cookie invalid/expired ဖြစ်ခြင်း သို့မဟုတ် session user မသုံးနိုင်တော့ခြင်း**

```json
{
  "success": false,
  "message": "Invalid or expired session",
  "code": "UNAUTHENTICATED"
}
```

**403 FORBIDDEN — Cashier က Owner-only route ကိုခေါ်ခြင်း**

```json
{
  "success": false,
  "message": "Permission denied",
  "code": "FORBIDDEN"
}
```

**403 CSRF_CHECK_FAILED — POST/PATCH မှာ X-Selo-Request မရှိ/1 မဟုတ်ခြင်း; login လည်း သက်ဆိုင်**

```json
{
  "success": false,
  "message": "Required request header is missing",
  "code": "CSRF_CHECK_FAILED"
}
```

**400 INVALID_JSON — JSON body syntax မှားခြင်း**

```json
{
  "success": false,
  "message": "Invalid JSON body",
  "code": "INVALID_JSON"
}
```

**400 VALIDATION_ERROR — PATCH body {} ဖြစ်ခြင်း (isActive-only status endpoints မပါ)**

```json
{
  "success": false,
  "message": "Provide at least one field to update",
  "code": "VALIDATION_ERROR"
}
```

**400 VALIDATION_ERROR — History query မှာ from > to ဖြစ်ခြင်း**

```json
{
  "success": false,
  "message": "From date must not be after to date",
  "code": "VALIDATION_ERROR"
}
```

**404 NOT_FOUND — မရှိတဲ့ URL/method; ဥပမာ POST /api/sales ကို correct CSRF header နဲ့ခေါ်ခြင်း**

```json
{
  "success": false,
  "message": "Route not found",
  "code": "NOT_FOUND"
}
```

**500 INTERNAL_SERVER_ERROR — Unhandled exception; backend log မှာ စစ်ရန်**

```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR"
}
```

Error precedence: CORS middleware → JSON parser → CSRF → route auth/role → body schema → controller query/params → service။ ဒါကြောင့် invalid body နဲ့ permission error နှစ်ခုလုံးဖြစ်နိုင်တဲ့ request မှာ ပထမဆုံးဖြစ်တဲ့ branch ပဲ ပြန်ပါတယ်။ Unknown route တစ်ခုကို CSRF header မပါဘဲ POST လုပ်ရင် 404 မတိုင်ခင် 403 ရနိုင်ပါတယ်။

## Frontend integration notes

1. Login success ပြီး cookie ကို browser က သိမ်းပါတယ်။ Page refresh/session recovery မှာ GET /api/auth/me ခေါ်ပါ။ 401 မှာ login screen ပြပြီး Owner-only action ကို 403 အတွက် သီးခြား handle လုပ်ပါ။ Login response/me data မှာ isActive မပါပါ။
2. IDs ကို Number မပြောင်းပါနဲ့။ Money request fields ကို decimal strings အဖြစ် ပို့ပါ။ Stock fields က base units ဖြစ်ပြီး purchase quantity က selected unit count ဖြစ်ပါတယ်။
3. Shared unit ID က product create/edit မှာ သုံးတဲ့ units[].unitId ဖြစ်ပြီး product-unit ID က detail units[].id ဖြစ်ပါတယ်။ Purchase line မှာ product-unit ID သုံးပါ။
4. Product create/edit success က id ပဲ ပြန်ပေးလို့ detail လိုရင် GET detail ပြန်ခေါ်ပြီး cached lists ကို refresh လုပ်ပါ။
5. Purchases မှာ idempotency key ကို logical submission တစ်ခုအတွက် တစ်ခါပဲထုတ်ပြီး network retry မှာ same body/same key သုံးပါ။ New purchase အတွက် key အသစ်သုံးပါ။ Manual adjustment ရဲ့ duplicate key က success replay မဟုတ်ဘဲ 409 ဖြစ်ပါတယ်။
6. Optional nullable text inputs မှာ empty string အစား null/omit သုံးပါ။ PATCH မှာ omit က unchanged; nullable field မှာ null က clear ဖြစ်ပါတယ်။
7. Owner-only cost fields (`latestPurchaseCost`, `unitCostSnapshot`) က Cashier response မှာ null မဟုတ်ဘဲ field လုံးဝမပါပါ။
8. Categories က paginated roots + children ပုံစံဖြစ်လို့ dropdown အတွက် roots pages အားလုံးလိုနိုင်ပါတယ်။ Units/categories/users မှာ status filter မရှိပါ။

## Not implemented yet

`POST /api/sales` ကို routes ထဲ မတပ်ရသေးပါ။ Customers, loyalty, returns, reports, dashboard endpoints တွေလည်း မရှိသေးပါ။ ဒီဖိုင်က future request contracts သို့မဟုတ် roadmap endpoints ကို implemented API အဖြစ် မဖော်ပြပါ။ API group အသစ်တွေ develop လုပ်ပြီးမှ ဒီ reference ကို update လုပ်ပါ။

## Reference verification

ဒီဖိုင်ရေးချိန်မှာ GET requests 17 ခုကို local MySQL နဲ့ temporary server ပေါ်ကနေ ခေါ်ယူပြီး HTTP 200 response snapshots သုံးထားပါတယ်။ POST/PATCH examples က current schema/service/controller shapes ကို လိုက်နာတဲ့ documentation examples ဖြစ်ပြီး ဒီဖိုင်ရေးဖို့ database insert/update မလုပ်ထားပါ။ Example success IDs 1001–1007 က placeholders ဖြစ်ပြီး existing records အဖြစ် မယူဆရပါ။ GET example IDs ကတော့ snapshot ရယူချိန် local records ဖြစ်ပါတယ်။ Endpoint error tables က current explicit AppError branches နဲ့ shared middleware ကို အခြေခံပါတယ်။

