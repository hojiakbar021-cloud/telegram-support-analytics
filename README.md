# Telegram Support Analytics

Django (backend) va React (frontend) asosida qurilgan Telegram support xabarlarini yig‘ish va tahlil qilish tizimi.

## Project Structure

```
telegram-support-analytics/
├── backend/
├── frontend/
├── .gitignore
├── LICENSE
├── package.json
└── package-lock.json
```

## Technologies

### Backend (Django)

* Django REST Framework
* PostgreSQL
* Telegram API integration

### Frontend (React)

* React 18
* TailwindCSS
* Axios
* Recharts (charts)

## Installation

### 1. Clone repo

```
git clone https://github.com/<your-username>/telegram-support-analytics.git
cd telegram-support-analytics
```

# Backend Setup (Django)

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend URL: [http://localhost:8000/](http://localhost:8000/)

# Frontend Setup (React)

```
cd ../frontend
npm install
npm start
```

Frontend URL:

* [http://localhost:3000/](http://localhost:3000/)

# Environment Variables

### Backend `.env`

```
DEBUG=True
SECRET_KEY=your_secret_key
DATABASE_URL=postgres://user:pass@localhost:5432/dbname
```

# Production Build

Frontend:

```
npm run build
```

Backend:

```
python manage.py collectstatic
```

# Features

* Telegram support xabarlarini yig‘ish
* Admin panel
* Statistikalar va grafiklar
* Backend ↔ Frontend integratsiyasi

# License

MIT License.
