# Tehtävienhallintasovellus

Diplomityön web-sovellus tehtävien hallintaan.

## Ominaisuudet

- Käyttäjän rekisteröityminen ja kirjautuminen (JWT)
- Tehtävien luonti, muokkaus ja poistaminen
- Tehtävien tila: Tehtävä (todo) → Käynnissä (in progress) → Valmis (done)
- Kanban-tyylinen näkymä

## Teknologiat

| Osa       | Teknologia                  |
|-----------|-----------------------------|
| Frontend  | React, HTML, CSS, JavaScript |
| Backend   | Python, Flask               |
| Tietokanta| PostgreSQL                  |
| Auth      | JWT (Flask-JWT-Extended)    |

## Projektirakenne

```
web-application/
├── backend/
│   ├── app.py              # Flask-sovelluksen pääohjelma
│   ├── config.py           # Asetukset
│   ├── models.py           # Tietokantamallit (User, Task)
│   ├── requirements.txt    # Python-riippuvuudet
│   ├── .env.example        # Ympäristömuuttujien esimerkki
│   └── routes/
│       ├── auth.py         # Kirjautuminen ja rekisteröityminen
│       └── tasks.py        # Tehtävien CRUD-operaatiot
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js          # Reititys
│       ├── App.css         # Tyylit
│       ├── index.js        # React-sovelluksen käynnistys
│       ├── components/
│       │   ├── Login.js    # Kirjautumislomake
│       │   ├── Register.js # Rekisteröitymislomake
│       │   ├── TaskBoard.js# Tehtävänäkymä (Kanban)
│       │   └── TaskModal.js# Tehtävän luonti/muokkaus
│       ├── context/
│       │   └── AuthContext.js
│       └── services/
│           └── api.js      # Axios-konfiguraatio
├── database/
│   └── schema.sql          # Tietokannan rakenne
└── README.md
```

## Käynnistys

### 1. Tietokanta

Asenna PostgreSQL ja luo tietokanta:

```sql
CREATE DATABASE taskmanager;
```

Tai aja schema-tiedosto:

```bash
psql -U postgres -f database/schema.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python app.py
```

Backend käynnistyy osoitteeseen `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend käynnistyy osoitteeseen `http://localhost:3000`.

## API-rajapinnat

| Metodi | Polku             | Kuvaus                    |
|--------|-------------------|---------------------------|
| POST   | /api/auth/register| Rekisteröityminen         |
| POST   | /api/auth/login   | Kirjautuminen             |
| GET    | /api/auth/me      | Kirjautuneen käyttäjän tiedot |
| GET    | /api/tasks        | Hae kaikki tehtävät       |
| POST   | /api/tasks        | Luo uusi tehtävä          |
| PUT    | /api/tasks/:id    | Muokkaa tehtävää          |
| DELETE | /api/tasks/:id    | Poista tehtävä            |