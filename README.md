# Tehtävienhallintasovellus

Web-sovellus tehtävien hallintaan.

## Ominaisuudet

- Käyttäjän rekisteröityminen ja kirjautuminen (JWT)
- Tehtävien luonti, muokkaus ja poistaminen
- Tehtävien tila: Tehtävä → Käynnissä → Valmis
- Kanban-tyylinen taulunäkymä vedä ja pudota -tuella
- Kalenterinäkymä
- Prioriteetit: matala, normaali, korkea
- Deadline-päivämäärä ja myöhässä-ilmoitukset
- Haku ja suodatus (teksti, prioriteetti, deadline)
- Sivupalkki: yhteenveto, edistymispalkki, varoitukset, tulevat deadlinet
- Asetukset: salasanan vaihto ja tilin poisto
- Tumma tila (dark mode) pysyvällä asetuksella
- Responsiivinen ulkoasu (mobiili + työpöytä)

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
│   ├── config.py           # Asetukset (ympäristömuuttujat)
│   ├── models.py           # Tietokantamallit (User, Task)
│   ├── conftest.py         # Pytest-konfiguraatio ja fixturet
│   ├── test_auth.py        # Autentikaatiotestit
│   ├── test_tasks.py       # Tehtävätestit
│   ├── requirements.txt    # Python-riippuvuudet
│   ├── .env                # Ympäristömuuttujat (ei versionhallinnassa)
│   └── routes/
│       ├── auth.py         # Rekisteröinti, kirjautuminen, salasana, tilin poisto
│       └── tasks.py        # Tehtävien CRUD-operaatiot
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js          # Reititys ja PrivateRoute
│       ├── App.css         # Kaikki tyylit + dark mode
│       ├── index.js        # React-sovelluksen käynnistys
│       ├── setupTests.js   # Testiympäristön konfiguraatio
│       ├── components/
│       │   ├── Login.js    # Kirjautumislomake
│       │   ├── Register.js # Rekisteröitymislomake
│       │   ├── TaskBoard.js# Pääsivu (Kanban + drag & drop)
│       │   ├── TaskModal.js# Tehtävän luonti/muokkaus -modaali
│       │   ├── Calendar.js # Kalenterinäkymä
│       │   ├── Sidebar.js  # Sivupalkki (tilastot, deadlinet)
│       │   ├── Settings.js # Asetussivu
│       │   └── __tests__/  # Komponenttitestit
│       ├── context/
│       │   ├── AuthContext.js  # Autentikaation tila
│       │   └── ThemeContext.js # Tumman tilan tila
│       └── services/
│           └── api.js      # Axios-konfiguraatio + interceptorit
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

| Metodi | Polku                    | Kuvaus                        |
|--------|--------------------------|-------------------------------|
| POST   | /api/auth/register       | Rekisteröityminen             |
| POST   | /api/auth/login          | Kirjautuminen                 |
| GET    | /api/auth/me             | Kirjautuneen käyttäjän tiedot |
| PUT    | /api/auth/change-password| Salasanan vaihto              |
| DELETE | /api/auth/delete-account | Tilin poistaminen             |
| GET    | /api/tasks               | Hae kaikki tehtävät           |
| POST   | /api/tasks               | Luo uusi tehtävä              |
| PUT    | /api/tasks/:id           | Muokkaa tehtävää              |
| DELETE | /api/tasks/:id           | Poista tehtävä                |

## Testit

### Backend (pytest)

```bash
cd backend
python -m pytest -v
```

41 testiä: rekisteröinti, kirjautuminen, salasanan vaihto, tilin poisto, tehtävien CRUD, prioriteetit, deadlinet, myöhässä-logiikka, käyttäjien eristäytyminen.

### Frontend (React Testing Library)

```bash
cd frontend
npm test
```

24 testiä: Login, Register, TaskModal ja Sidebar -komponenttien renderöinti, käyttäjätoiminnot ja virhetilanteet.
