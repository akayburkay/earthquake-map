from sqlalchemy import create_engine, Column, String, Float, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
import requests
from datetime import datetime, timedelta
from geoalchemy2 import Geometry

DB_URL = "postgresql+psycopg2://postgres:123@localhost:5432/afet"

engine = create_engine(DB_URL)
Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()

class Earthquake(Base):
    __tablename__ = 'earthquake'

    id = Column(String, primary_key=True)
    time = Column(DateTime)
    magnitude = Column(Float)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    depth = Column(Float)
    geom = Column(Geometry(geometry_type='POINT', srid=4326))

Base.metadata.create_all(engine)

def fetch_and_store_earthquakes():
    print("Deprem verileri alınıyor...")

    url = 'https://earthquake.usgs.gov/fdsnws/event/1/query'
    
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=360)

    params = {
    'format': 'geojson',
    'starttime': start_date.isoformat(),
    'endtime': end_date.isoformat(),
    'minmagnitude': 4,
    'minlatitude': 35,  
    'maxlatitude': 43,  
    'minlongitude': 26,  
    'maxlongitude': 45,  
}

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        new_count = 0

        for feature in data['features']:
            event_id = feature['id']
            if session.query(Earthquake).filter_by(id=event_id).first():
                continue  

            props = feature['properties']
            coords = feature['geometry']['coordinates']

            earthquake = Earthquake(
                id=event_id,
                time=datetime.utcfromtimestamp(props['time'] / 1000),
                magnitude=props['mag'],
                location=props['place'],
                latitude=coords[1],
                longitude=coords[0],
                depth=coords[2]
            )
            session.add(earthquake)
            session.flush()  

            session.execute(text("""
UPDATE earthquake
SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE id = :id
"""), {'id': earthquake.id})

            new_count += 1

        session.commit()
        print(f"{new_count} yeni deprem verisi eklendi.")
    
    except Exception as e:
        print(f"Hata oluştu: {e}")

if __name__ == '__main__':
    fetch_and_store_earthquakes()
