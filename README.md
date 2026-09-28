# Hệ thống Quản lý Kho & Bảo hành

Đây là project cho hệ thống quản lý xuất kho và theo dõi vòng đời bảo hành sản phẩm.

## Cấu trúc project

- `frontend/`: Chứa mã nguồn cho ứng dụng web frontend (ReactJS với Vite).
- `backend/`: Chứa mã nguồn cho ứng dụng backend (Node.js với Express.js và TypeScript).

## Hướng dẫn cài đặt và chạy

### 1. Backend

Di chuyển vào thư mục `backend` và cài đặt các dependency:

```bash
cd backend
npm install
```

Thiết lập biến môi trường và cấu hình database trong file `.env` (chưa tạo).

Để chạy backend (dev mode):

```bash
npm run dev # Hoặc script tương tự
```

### 2. Frontend

Di chuyển vào thư mục `frontend` và cài đặt các dependency:

```bash
cd frontend
npm install
```

Để chạy frontend (dev mode):

```bash
npm run dev
```

Ứng dụng frontend sẽ chạy trên `http://localhost:5173` (mặc định của Vite).
