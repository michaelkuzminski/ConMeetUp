from peewee import SqliteDatabase, Model, AutoField, CharField, ForeignKeyField, CompositeKey, DateTimeField, BooleanField

DB_NAME = "database.db"
UPLOAD_DIR = "uploads"

class Database(object):
    instance = SqliteDatabase(DB_NAME, pragmas={'foreign_keys': 1})
    instance.connect()

    @staticmethod
    def init():
        Database.instance.create_tables([Events, Maps, Users, UsersEvents, Locations, UserSightings, ChatMessages])

class BaseModel(Model):
    class Meta:
        database = Database.instance

class Events(BaseModel):
    id = AutoField()
    display_name = CharField(null = False)
    is_active = BooleanField(default = False)

class Maps(BaseModel):
    id = AutoField()
    display_name = CharField(null = False)
    content = CharField(null = False)
    event = ForeignKeyField(Events)

    @property
    def filepath(self):
        return "%s/%s_%s" % (UPLOAD_DIR, self.id, self.display_name)
    
    def to_dict(self):
        return {
            'id': self.id,
            'display_name': self.display_name,
            'content': self.content
        }

class Users(BaseModel):
    id = AutoField()
    display_name = CharField(null = False)
    user_name = CharField(null = False)
    user_password = CharField(null = False)
    is_admin = BooleanField(default = False)

class UsersEvents(BaseModel):
    user = ForeignKeyField(Users)
    event = ForeignKeyField(Events)

    class Meta:
        primary_key = CompositeKey('user', 'event')

class Locations(BaseModel):
    id = AutoField()
    display_name = CharField(null = False)
    event = ForeignKeyField(Events)

    def to_dict(self):
        return {
            'id': self.id,
            'display_name': self.display_name
        }

class UserSightings(BaseModel):
    id = AutoField()
    user = ForeignKeyField(Users)
    event = ForeignKeyField(Events)
    sighting_time = DateTimeField(null=False)
    location = ForeignKeyField(Locations)

    def to_dict(self):
        return {
            'user': self.user.display_name,
            'sighting_time': str(self.sighting_time)[11:],
            'location': self.location.display_name,
        }

class ChatMessages(BaseModel):
    id = AutoField()
    user = ForeignKeyField(Users)
    message = CharField(null = False)
    sent_at = DateTimeField(null=False)
        
    def to_dict(self):
        return {
            'user': self.user.display_name,
            'sent_at': str(self.sent_at)[11:],
            'message': self.message,
        }