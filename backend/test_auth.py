"""Autentikaatioreittien testit."""


class TestRegister:
    def test_register_success(self, client):
        res = client.post('/api/auth/register', json={
            'username': 'newuser',
            'password': 'password123'
        })
        assert res.status_code == 201
        data = res.get_json()
        assert 'token' in data
        assert data['username'] == 'newuser'

    def test_register_missing_username(self, client):
        res = client.post('/api/auth/register', json={
            'username': '',
            'password': 'password123'
        })
        assert res.status_code == 400

    def test_register_missing_password(self, client):
        res = client.post('/api/auth/register', json={
            'username': 'user1',
            'password': ''
        })
        assert res.status_code == 400

    def test_register_short_password(self, client):
        res = client.post('/api/auth/register', json={
            'username': 'user1',
            'password': '12345'
        })
        assert res.status_code == 400

    def test_register_duplicate_username(self, client, test_user):
        res = client.post('/api/auth/register', json={
            'username': 'testuser',
            'password': 'password123'
        })
        assert res.status_code == 409


class TestLogin:
    def test_login_success(self, client, test_user):
        res = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'password123'
        })
        assert res.status_code == 200
        data = res.get_json()
        assert 'token' in data
        assert data['username'] == 'testuser'

    def test_login_wrong_password(self, client, test_user):
        res = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        assert res.status_code == 401

    def test_login_nonexistent_user(self, client):
        res = client.post('/api/auth/login', json={
            'username': 'nobody',
            'password': 'password123'
        })
        assert res.status_code == 401


class TestGetCurrentUser:
    def test_get_me_success(self, client, auth_header):
        res = client.get('/api/auth/me', headers=auth_header)
        assert res.status_code == 200
        data = res.get_json()
        assert data['username'] == 'testuser'

    def test_get_me_unauthorized(self, client):
        res = client.get('/api/auth/me')
        assert res.status_code == 401


class TestChangePassword:
    def test_change_password_success(self, client, auth_header):
        res = client.put('/api/auth/change-password', headers=auth_header, json={
            'current_password': 'password123',
            'new_password': 'newpassword123'
        })
        assert res.status_code == 200

        # Verify new password works
        res = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'newpassword123'
        })
        assert res.status_code == 200

    def test_change_password_wrong_current(self, client, auth_header):
        res = client.put('/api/auth/change-password', headers=auth_header, json={
            'current_password': 'wrongpassword',
            'new_password': 'newpassword123'
        })
        assert res.status_code == 401

    def test_change_password_too_short(self, client, auth_header):
        res = client.put('/api/auth/change-password', headers=auth_header, json={
            'current_password': 'password123',
            'new_password': '123'
        })
        assert res.status_code == 400


class TestDeleteAccount:
    def test_delete_account_success(self, client, auth_header):
        res = client.delete('/api/auth/delete-account', headers=auth_header, json={
            'password': 'password123'
        })
        assert res.status_code == 200

        # Verify user can no longer login
        res = client.post('/api/auth/login', json={
            'username': 'testuser',
            'password': 'password123'
        })
        assert res.status_code == 401

    def test_delete_account_wrong_password(self, client, auth_header):
        res = client.delete('/api/auth/delete-account', headers=auth_header, json={
            'password': 'wrongpassword'
        })
        assert res.status_code == 401
