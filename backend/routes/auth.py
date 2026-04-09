from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Käyttäjänimi ja salasana vaaditaan'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Salasanan tulee olla vähintään 6 merkkiä'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Käyttäjänimi on jo käytössä'}), 409

    user = User(
        username=username,
        password_hash=generate_password_hash(password)
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'username': user.username}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Virheellinen käyttäjänimi tai salasana'}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({'token': token, 'username': user.username}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'Käyttäjää ei löydy'}), 404
    return jsonify({'id': user.id, 'username': user.username}), 200

@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Käyttäjää ei löydy'}), 404

    data = request.get_json()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({'error': 'Nykyinen salasana on virheellinen'}), 401

    if len(new_password) < 6:
        return jsonify({'error': 'Uuden salasanan tulee olla vähintään 6 merkkiä'}), 400

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({'message': 'Salasana vaihdettu onnistuneesti'}), 200

@auth_bp.route('/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Käyttäjää ei löydy'}), 404

    data = request.get_json()
    password = data.get('password', '')

    if not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Virheellinen salasana'}), 401

    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Tili poistettu onnistuneesti'}), 200
