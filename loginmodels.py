from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from db import db

class User(db.Model):
    __tablename__ = 'users'  

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'

    # Şifreyi hashlemek için bir yöntem
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Şifreyi doğrulamak için bir yöntem
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
