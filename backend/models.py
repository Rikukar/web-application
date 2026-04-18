from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone, date

db = SQLAlchemy()

# Käyttäjämalli – sisältää kirjautumistiedot ja omistaa tehtävät
class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    tasks = db.relationship('Task', backref='owner', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username}>'

# Tehtävämalli – yksittäinen tehtävä tila-, prioriteetti- ja deadline-tiedoilla
class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, default='')
    status = db.Column(db.String(20), default='todo')  # todo, in_progress, done
    priority = db.Column(db.String(10), default='normal')  # low, normal, high
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    @property
    def is_overdue(self):
        """Tarkistaa onko tehtävä myöhässä (deadline mennyt eikä valmis)."""
        if self.due_date and self.status != 'done':
            return self.due_date < date.today()
        return False

    def to_dict(self):
        """Muuntaa tehtävän JSON-yhteensopivaksi sanakirjaksi API-vastauksiin."""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'is_overdue': self.is_overdue,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
        }

    def __repr__(self):
        return f'<Task {self.title}>'
