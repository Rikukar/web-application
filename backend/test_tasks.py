"""Tehtäväreittien testit."""
from datetime import date, timedelta


class TestGetTasks:
    def test_get_tasks_empty(self, client, auth_header):
        res = client.get('/api/tasks', headers=auth_header)
        assert res.status_code == 200
        assert res.get_json() == []

    def test_get_tasks_returns_own_tasks(self, client, auth_header):
        client.post('/api/tasks', headers=auth_header, json={
            'title': 'Tehtävä 1'
        })
        client.post('/api/tasks', headers=auth_header, json={
            'title': 'Tehtävä 2'
        })
        res = client.get('/api/tasks', headers=auth_header)
        assert res.status_code == 200
        assert len(res.get_json()) == 2

    def test_get_tasks_filter_by_status(self, client, auth_header):
        client.post('/api/tasks', headers=auth_header, json={
            'title': 'Todo', 'status': 'todo'
        })
        client.post('/api/tasks', headers=auth_header, json={
            'title': 'Done', 'status': 'done'
        })
        res = client.get('/api/tasks?status=done', headers=auth_header)
        data = res.get_json()
        assert len(data) == 1
        assert data[0]['title'] == 'Done'

    def test_get_tasks_unauthorized(self, client):
        res = client.get('/api/tasks')
        assert res.status_code == 401

    def test_tasks_isolated_between_users(self, client, auth_header):
        """Käyttäjä ei näe toisen käyttäjän tehtäviä."""
        client.post('/api/tasks', headers=auth_header, json={
            'title': 'User 1 task'
        })

        # Create second user
        res = client.post('/api/auth/register', json={
            'username': 'user2', 'password': 'password123'
        })
        token2 = res.get_json()['token']
        header2 = {'Authorization': f'Bearer {token2}'}

        res = client.get('/api/tasks', headers=header2)
        assert res.get_json() == []


class TestCreateTask:
    def test_create_task_minimal(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Uusi tehtävä'
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data['title'] == 'Uusi tehtävä'
        assert data['status'] == 'todo'
        assert data['priority'] == 'normal'
        assert data['due_date'] is None

    def test_create_task_full(self, client, auth_header):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Tärkeä tehtävä',
            'description': 'Kuvaus',
            'status': 'in_progress',
            'priority': 'high',
            'due_date': tomorrow
        })
        assert res.status_code == 201
        data = res.get_json()
        assert data['title'] == 'Tärkeä tehtävä'
        assert data['description'] == 'Kuvaus'
        assert data['status'] == 'in_progress'
        assert data['priority'] == 'high'
        assert data['due_date'] == tomorrow

    def test_create_task_missing_title(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': ''
        })
        assert res.status_code == 400

    def test_create_task_invalid_status(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Test', 'status': 'invalid'
        })
        assert res.status_code == 400

    def test_create_task_invalid_priority(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Test', 'priority': 'urgent'
        })
        assert res.status_code == 400

    def test_create_task_invalid_date(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Test', 'due_date': 'not-a-date'
        })
        assert res.status_code == 400


class TestUpdateTask:
    def _create_task(self, client, auth_header, **kwargs):
        data = {'title': 'Test tehtävä', **kwargs}
        res = client.post('/api/tasks', headers=auth_header, json=data)
        return res.get_json()['id']

    def test_update_title(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'title': 'Uusi otsikko'
        })
        assert res.status_code == 200
        assert res.get_json()['title'] == 'Uusi otsikko'

    def test_update_status(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'status': 'done'
        })
        assert res.status_code == 200
        assert res.get_json()['status'] == 'done'

    def test_update_priority(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'priority': 'high'
        })
        assert res.status_code == 200
        assert res.get_json()['priority'] == 'high'

    def test_update_due_date(self, client, auth_header):
        next_week = (date.today() + timedelta(days=7)).isoformat()
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'due_date': next_week
        })
        assert res.status_code == 200
        assert res.get_json()['due_date'] == next_week

    def test_update_remove_due_date(self, client, auth_header):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        task_id = self._create_task(client, auth_header, due_date=tomorrow)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'due_date': None
        })
        assert res.status_code == 200
        assert res.get_json()['due_date'] is None

    def test_update_empty_title(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'title': ''
        })
        assert res.status_code == 400

    def test_update_invalid_status(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.put(f'/api/tasks/{task_id}', headers=auth_header, json={
            'status': 'invalid'
        })
        assert res.status_code == 400

    def test_update_nonexistent_task(self, client, auth_header):
        res = client.put('/api/tasks/9999', headers=auth_header, json={
            'title': 'Nope'
        })
        assert res.status_code == 404

    def test_update_other_users_task(self, client, auth_header):
        """Ei voi muokata toisen käyttäjän tehtävää."""
        task_id = self._create_task(client, auth_header)

        res = client.post('/api/auth/register', json={
            'username': 'user2', 'password': 'password123'
        })
        token2 = res.get_json()['token']
        header2 = {'Authorization': f'Bearer {token2}'}

        res = client.put(f'/api/tasks/{task_id}', headers=header2, json={
            'title': 'Hacked'
        })
        assert res.status_code == 404


class TestDeleteTask:
    def _create_task(self, client, auth_header):
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Poistettava'
        })
        return res.get_json()['id']

    def test_delete_task_success(self, client, auth_header):
        task_id = self._create_task(client, auth_header)
        res = client.delete(f'/api/tasks/{task_id}', headers=auth_header)
        assert res.status_code == 200

        # Verify it's gone
        res = client.get('/api/tasks', headers=auth_header)
        assert len(res.get_json()) == 0

    def test_delete_nonexistent_task(self, client, auth_header):
        res = client.delete('/api/tasks/9999', headers=auth_header)
        assert res.status_code == 404

    def test_delete_other_users_task(self, client, auth_header):
        """Ei voi poistaa toisen käyttäjän tehtävää."""
        task_id = self._create_task(client, auth_header)

        res = client.post('/api/auth/register', json={
            'username': 'user2', 'password': 'password123'
        })
        token2 = res.get_json()['token']
        header2 = {'Authorization': f'Bearer {token2}'}

        res = client.delete(f'/api/tasks/{task_id}', headers=header2)
        assert res.status_code == 404


class TestOverdue:
    def test_overdue_flag(self, client, auth_header):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Myöhässä', 'due_date': yesterday
        })
        assert res.status_code == 201
        assert res.get_json()['is_overdue'] is True

    def test_not_overdue_future(self, client, auth_header):
        tomorrow = (date.today() + timedelta(days=1)).isoformat()
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Tuleva', 'due_date': tomorrow
        })
        assert res.status_code == 201
        assert res.get_json()['is_overdue'] is False

    def test_done_task_not_overdue(self, client, auth_header):
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        res = client.post('/api/tasks', headers=auth_header, json={
            'title': 'Valmis', 'due_date': yesterday, 'status': 'done'
        })
        assert res.status_code == 201
        assert res.get_json()['is_overdue'] is False
