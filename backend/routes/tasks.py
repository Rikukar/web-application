from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date, timedelta
from sqlalchemy import func
from models import db, Task

tasks_bp = Blueprint('tasks', __name__)

VALID_STATUSES = ['todo', 'in_progress', 'done']
VALID_PRIORITIES = ['low', 'normal', 'high']

@tasks_bp.route('', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    status_filter = request.args.get('status')

    query = Task.query.filter_by(user_id=user_id)
    if status_filter and status_filter in VALID_STATUSES:
        query = query.filter_by(status=status_filter)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify([task.to_dict() for task in tasks]), 200

@tasks_bp.route('', methods=['POST'])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    title = data.get('title', '').strip()
    if not title:
        return jsonify({'error': 'Tehtävän otsikko vaaditaan'}), 400

    status = data.get('status', 'todo')
    if status not in VALID_STATUSES:
        return jsonify({'error': f'Virheellinen tila. Sallitut: {VALID_STATUSES}'}), 400

    priority = data.get('priority', 'normal')
    if priority not in VALID_PRIORITIES:
        return jsonify({'error': f'Virheellinen prioriteetti. Sallitut: {VALID_PRIORITIES}'}), 400

    due_date = None
    if data.get('due_date'):
        try:
            due_date = date.fromisoformat(data['due_date'])
        except ValueError:
            return jsonify({'error': 'Virheellinen päivämäärä'}), 400

    task = Task(
        title=title,
        description=data.get('description', '').strip(),
        status=status,
        priority=priority,
        due_date=due_date,
        user_id=user_id
    )
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Tehtävää ei löydy'}), 404

    data = request.get_json()

    if 'title' in data:
        title = data['title'].strip()
        if not title:
            return jsonify({'error': 'Tehtävän otsikko ei voi olla tyhjä'}), 400
        task.title = title

    if 'description' in data:
        task.description = data['description'].strip()

    if 'status' in data:
        if data['status'] not in VALID_STATUSES:
            return jsonify({'error': f'Virheellinen tila. Sallitut: {VALID_STATUSES}'}), 400
        task.status = data['status']

    if 'priority' in data:
        if data['priority'] not in VALID_PRIORITIES:
            return jsonify({'error': f'Virheellinen prioriteetti. Sallitut: {VALID_PRIORITIES}'}), 400
        task.priority = data['priority']

    if 'due_date' in data:
        if data['due_date']:
            try:
                task.due_date = date.fromisoformat(data['due_date'])
            except ValueError:
                return jsonify({'error': 'Virheellinen päivämäärä'}), 400
        else:
            task.due_date = None

    db.session.commit()
    return jsonify(task.to_dict()), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task = Task.query.filter_by(id=task_id, user_id=user_id).first()

    if not task:
        return jsonify({'error': 'Tehtävää ei löydy'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Tehtävä poistettu'}), 200


@tasks_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    user_id = int(get_jwt_identity())
    tasks = Task.query.filter_by(user_id=user_id).all()

    today = date.today()

    # Tila-jakauma
    status_counts = {'todo': 0, 'in_progress': 0, 'done': 0}
    priority_counts = {'low': 0, 'normal': 0, 'high': 0}
    overdue_count = 0

    for t in tasks:
        status_counts[t.status] = status_counts.get(t.status, 0) + 1
        priority_counts[t.priority] = priority_counts.get(t.priority, 0) + 1
        if t.is_overdue:
            overdue_count += 1

    # Viimeisten 4 viikon valmistuneet (viikottain)
    weekly_done = []
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=today.weekday() + 7 * i)
        week_end = week_start + timedelta(days=6)
        count = 0
        for t in tasks:
            if t.status == 'done' and t.updated_at:
                updated_date = t.updated_at.date()
                if week_start <= updated_date <= week_end:
                    count += 1
        week_label = f"{week_start.day}.{week_start.month}.–{week_end.day}.{week_end.month}."
        weekly_done.append({'week': week_label, 'count': count})

    # Viimeisten 4 viikon luodut
    weekly_created = []
    for i in range(3, -1, -1):
        week_start = today - timedelta(days=today.weekday() + 7 * i)
        week_end = week_start + timedelta(days=6)
        count = 0
        for t in tasks:
            if t.created_at:
                created_date = t.created_at.date()
                if week_start <= created_date <= week_end:
                    count += 1
        week_label = f"{week_start.day}.{week_start.month}.–{week_end.day}.{week_end.month}."
        weekly_created.append({'week': week_label, 'count': count})

    # Deadlinet tällä viikolla
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    deadlines_this_week = []
    for t in tasks:
        if t.due_date and t.status != 'done' and week_start <= t.due_date <= week_end:
            deadlines_this_week.append(t.to_dict())

    return jsonify({
        'total': len(tasks),
        'status': status_counts,
        'priority': priority_counts,
        'overdue': overdue_count,
        'weekly_done': weekly_done,
        'weekly_created': weekly_created,
        'deadlines_this_week': deadlines_this_week,
    }), 200
