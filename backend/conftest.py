import pytest
from app import create_app
from models import db as _db, User
from werkzeug.security import generate_password_hash


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'test-secret-key'
    SECRET_KEY = 'test-secret'


@pytest.fixture(scope='session')
def app():
    app = create_app()
    app.config.from_object(TestConfig)

    with app.app_context():
        _db.create_all()

    yield app


@pytest.fixture(autouse=True)
def db_session(app):
    with app.app_context():
        _db.create_all()
        yield _db
        _db.session.rollback()
        for table in reversed(_db.metadata.sorted_tables):
            _db.session.execute(table.delete())
        _db.session.commit()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def test_user(db_session, app):
    with app.app_context():
        user = User(
            username='testuser',
            password_hash=generate_password_hash('password123')
        )
        db_session.session.add(user)
        db_session.session.commit()
        return {'id': user.id, 'username': user.username, 'password': 'password123'}


@pytest.fixture
def auth_header(client, test_user):
    res = client.post('/api/auth/login', json={
        'username': test_user['username'],
        'password': test_user['password']
    })
    token = res.get_json()['token']
    return {'Authorization': f'Bearer {token}'}
