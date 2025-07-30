from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from src.core.config import settings

# Create the SQLAlchemy engine that will connect to our database
# The 'pool_pre_ping=True' checks if the connection is alive before using it.
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)

# Create a SessionLocal class. Each instance of this class will be a new database session.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class. Our database model classes will inherit from this.
Base = declarative_base()

# Dependency to get a database session
# This function will be used in our API endpoints to get a session
# and ensure it's always closed after the request is finished.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()