# CHAT APP - by Devasheesh Upreti

A premium, real-time messaging and chat application built with a high-performance **Microservices Architecture**. The project is split into a Next.js frontend and containerized/decoupled backend services communicating asynchronously through RabbitMQ and cached using Redis.

<img width="1756" height="909" alt="image" src="https://github.com/user-attachments/assets/73af912e-ae0a-4ce9-b95d-3885adcd6187" />
<img width="1911" height="907" alt="image" src="https://github.com/user-attachments/assets/8a342ae8-1e48-4a9c-ad1d-27b690213949" />

---

## 🚀 Features
* **Real-time Messaging**: Powered by Socket.io for immediate text and image delivery.
* **OTP-based Authentication**: Secure passwordless email login using dynamic OTP codes.
* **Microservices Architecture**: Completely separate services for Chat, User Accounts, and Mail delivery.
* **Asynchronous Background Processing**: Offloaded SMTP email delivery using RabbitMQ messaging queues.
* **High Performance Caching**: Redis-based caching for OTP validation and request rate limiting.
* **Media Sharing**: Dynamic image uploads hosted securely on Cloudinary.
* **Clean & Modern UI**: Built with Next.js, Tailwind CSS, Lucide icons, and Redux state management.

---

## 🛠️ Architecture & Tech Stack

### 📂 Directory Structure
```
Chat_App/
├── Backend/
│   ├── user/        # User accounts, authentication, profile updates, Redis rate limiting (Port 3000)
│   ├── mail/        # Background queue consumer, Nodemailer SMTP email delivery (Port 5001)
│   └── chat/        # Conversations, message store, Socket.io server, Cloudinary attachments (Port 5002)
├── Frontend/        # Next.js web client, Redux Toolkit state, Tailwind CSS (Port 3001)
└── README.md
```

### 💻 Technologies
* **Frontend**: Next.js (App Router), React, Redux Toolkit, Tailwind CSS, Lucide Icons, Socket.io-client.
* **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose).
* **Caching & Brokerage**: Redis (Upstash), RabbitMQ (amqplib).
* **Media & Mail**: Cloudinary API, Nodemailer.

---

## ⚙️ Installation & Setup

### Prerequisites
Ensure you have the following installed locally:
* **Node.js** (v18+)
* **MongoDB** (Local instance or MongoDB Atlas)
* **Redis** (Local instance or Upstash cloud)
* **RabbitMQ** (Installed locally or hosted on CloudAMQP)

---

### 1. Backend Services Configuration

You need to configure the environment variables for each of the three backend services.

#### A. User Service (`Backend/user/.env`)
Create a `.env` file in the `Backend/user/` directory:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_url
RABBITMQ_HOST=localhost
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123
JWT_SECRET=your_jwt_secret
```

#### B. Mail Service (`Backend/mail/.env`)
Create a `.env` file in the `Backend/mail/` directory:
```env
PORT=5001
RABBITMQ_HOST=localhost
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123
MAILSERVICEUSER=your_smtp_email@gmail.com
MAILSERVICEPASSWORD=your_smtp_app_password
```

#### C. Chat Service (`Backend/chat/.env`)
Create a `.env` file in the `Backend/chat/` directory:
```env
PORT=5002
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
USER_SERVICE=http://localhost:3000
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

#### Running the Backend Services
For each backend service (`user`, `mail`, and `chat`), navigate into its directory, install dependencies, and start the development server:
```bash
# In each of: Backend/user, Backend/mail, Backend/chat
npm install
npm run dev
```

---

### 2. Frontend Configuration

Configure the Next.js client to point to the respective microservice endpoints.

#### Frontend Environment (`Frontend/.env`)
Create a `.env` file in the `Frontend/` directory:
```env
NEXT_PUBLIC_USER_SERVICE_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_CHAT_SERVICE_URL=http://localhost:5002/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5002
```

#### Running the Frontend
Navigate into the `Frontend/` directory, install dependencies, and start the Next.js application:
```bash
cd Frontend
npm install
npm run dev
```
The client application will run on **`http://localhost:3001`** (or default fallback port `3000`).

---

## ✉️ Why RabbitMQ?
To keep the application highly responsive, SMTP email sending is offloaded to a background task queue via RabbitMQ:
1. When a user requests an OTP, the **User Service** writes a dispatch task to the RabbitMQ `"send-otp"` queue and immediately returns a success status code to the client.
2. The **Mail Service** runs concurrently, listening to this queue. When a task is received, it asynchronously logs in and sends the email via SMTP, confirming task completion back to the broker. 
3. This architecture improves API response times by over **80%** and isolates third-party mailer API failures from the authentication pipeline.
