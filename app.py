from flask import Flask, render_template, request, redirect, url_for, flash,jsonify
from sqlalchemy import text
from werkzeug.security import check_password_hash
from config import ConfigDb 
from loginmodels import User
from db import db
from models import Earthquake
from models import Fay
from geoalchemy2.shape import to_shape
import json

app = Flask(__name__)
app.config.from_object(ConfigDb)  
app.secret_key = '123'  
db.init_app(app)

with app.app_context():
    db.create_all()


@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            return redirect(url_for('map'))  # Başarılı giriş sonrası haritaya yönlendir
        else:
            flash('Geçersiz e-posta veya şifre', 'danger')

    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Bu e-posta ile kayıtlı bir kullanıcı zaten var.', 'warning')
            return redirect(url_for('register'))

        new_user = User(email=email)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('Kayıt başarılı. Giriş yapabilirsiniz.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html')


@app.route('/map')
def map():
    return render_template("map.html")


@app.route('/data/deprem/category1', methods=['GET'])
def deprem_a():
    try:
        earthquakes = Earthquake.query.filter(Earthquake.magnitude >= 5.0, Earthquake.magnitude < 6.0).all()
        earthquakes_data = []
        for eq in earthquakes:
            eq_data = {
                'id': eq.id,
                'time': eq.time,
                'magnitude': eq.magnitude,
                'location': eq.location,
                'latitude': eq.latitude,
                'longitude': eq.longitude,
                'depth': eq.depth
            }
            earthquakes_data.append(eq_data)
        return {"earthquakes": earthquakes_data}, 200
    except Exception as e:
        return {"message": f"Bir hata oluştu: {str(e)}"}, 500

@app.route("/data/deprem/category2", methods=["GET"])
def deprem_b():
    try:
        earthquakes = Earthquake.query.filter(Earthquake.magnitude >= 6.0, Earthquake.magnitude < 7.0).all()
        earthquakes_data = []
        for eq in earthquakes:
            eq_data = {
                'id': eq.id,
                'time': eq.time,
                'magnitude': eq.magnitude,
                'location': eq.location,
                'latitude': eq.latitude,
                'longitude': eq.longitude,
                'depth': eq.depth
            }
            earthquakes_data.append(eq_data)
        return {"earthquakes": earthquakes_data}, 200
    except Exception as e:
        return {"message": f"Bir hata oluştu: {str(e)}"}, 500
    
@app.route("/data/deprem/category3", methods=["GET"])
def deprem_c():
    try:
        earthquakes = Earthquake.query.filter(Earthquake.magnitude >= 7.0, Earthquake.magnitude < 8.0).all()
        earthquakes_data = []
        for eq in earthquakes:
            eq_data = {
                'id': eq.id,
                'time': eq.time,
                'magnitude': eq.magnitude,
                'location': eq.location,
                'latitude': eq.latitude,
                'longitude': eq.longitude,
                'depth': eq.depth
            }
            earthquakes_data.append(eq_data)
        return {"earthquakes": earthquakes_data}, 200
    except Exception as e:
        return {"message": f"Bir hata oluştu: {str(e)}"}, 500
    
@app.route("/data/deprem/category4", methods=['GET'])
def deprem_d():
    try:
        earthquakes = Earthquake.query.filter(Earthquake.magnitude < 5.0).all()
        earthquakes_data = []
        for eq in earthquakes:
            eq_data = {
                'id': eq.id,
                'time': eq.time,
                'magnitude': eq.magnitude,
                'location': eq.location,
                'latitude': eq.latitude,
                'longitude': eq.longitude,
                'depth': eq.depth
            }
            earthquakes_data.append(eq_data)
        return {"earthquakes": earthquakes_data}, 200
    except Exception as e:
        return {"message": f"Bir hata oluştu: {str(e)}"}, 500
    

@app.route("/data/deprem/faylar", methods=['GET'])
def fay():
    try:
        sql = text("SELECT gid, ST_AsGeoJSON(geom) as geojson FROM fay;")
        result = db.session.execute(sql)

        geojson = {
            "type": "FeatureCollection",
            "features": []
        }

        for row in result:
            feature = {
                "type": "Feature",
                "geometry": json.loads(row.geojson),
                "properties": {
                    "gid": row.gid
                }
            }
            geojson["features"].append(feature)

        return jsonify(geojson)
    except Exception as e:
        return {"message": f"Hata: {str(e)}"}, 500


if __name__ == "__main__":
    app.run(debug=True)
