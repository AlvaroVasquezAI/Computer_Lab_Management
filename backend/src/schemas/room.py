from pydantic import BaseModel

class Room(BaseModel):
    room_id: int
    room_name: str
    class Config:
        from_attributes = True