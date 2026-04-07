from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from models import db, Task

tasks_bp = Blueprint('tasks', __name__)

VALID_STATUSES = ['todo', 'in_progress', 'done']

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
