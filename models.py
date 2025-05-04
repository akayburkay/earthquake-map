from datetime import datetime
from db import db
from geoalchemy2 import Geometry


class Earthquake(db.Model):
    __tablename__ = 'earthquake'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True) 
    time = db.Column(db.DateTime)
    magnitude = db.Column(db.Float)
    location = db.Column(db.String)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    depth = db.Column(db.Float)

    def __init__(self, time, magnitude, location, latitude, longitude, depth):
        self.time = time
        self.magnitude = magnitude
        self.location = location
        self.latitude = latitude
        self.longitude = longitude
        self.depth = depth


class Fay(db.Model):
    __tablename__ = 'fay'
    gid = db.Column(db.Integer, primary_key=True)
    geom = db.Column(Geometry('LINESTRING'))
