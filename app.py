import sqlite3
from flask import Flask, redirect, render_template, request, jsonify, session, redirect
from models import *
from datetime import datetime, timedelta
from peewee import fn

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def get_maps_locations_users_by_event_id(event_id):
    maps = Maps.select().where(Maps.event == event_id)
    locations = Locations.select().where(Locations.event == event_id)
    users = Users.select().join(UsersEvents).where(UsersEvents.event == event_id)

    return maps, locations, users

app = Flask(__name__)
# Set the secret key to some random bytes. Keep this really secret!
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

def check_for_valid_session():
    try:
        if 'user_id' in session:
            foundUser = Users.select().where(Users.id == session['user_id']).first()

            if foundUser is None:
                return False
            else:
                userPartOfCurrentEvent = Events.select().join(UsersEvents).where(UsersEvents.user == foundUser.id, Events.is_active == True).first()
                if userPartOfCurrentEvent is None:
                    return check_for_valid_admin_session();
            return True
        return False
    except:
        return False

def check_for_valid_admin_session():
    if 'user_id' in session:
        foundUser = Users.select().where(Users.id == session['user_id'], Users.is_admin == True).first()

        if foundUser is None:
            return False
        return True
    return False

@app.route('/')
def init():
    if check_for_valid_session():
        return redirect('/sightings')    
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']

    foundUser = Users.select().where(Users.user_name == username, Users.user_password == password).first()

    if foundUser is None:
        return jsonify({'status': 'error', 'message': 'Benutzername oder Passwort falsch!'})
    
    if not foundUser.is_admin:
        userPartOfCurrentEvent = Events.select().join(UsersEvents).where(UsersEvents.user == foundUser.id, Events.is_active == True).first()
        if userPartOfCurrentEvent is None:
            return jsonify({'status': 'error', 'message': 'Benutzer ist kein Teilnehmer des aktuellen Events!'})
    
    session['user_id'] = foundUser.id

    return jsonify({'status': 'success'})

@app.route('/sightings')
def sightings():
    if not check_for_valid_session():
        return redirect('/')

    today = datetime.today().date()

    maps = Maps.select().where(Maps.event == Events.select().where(Events.is_active == True).first())
    users = Users.select().join(UsersEvents).where(UsersEvents.event == Events.select().where(Events.is_active == True).first())
    locations = Locations.select().where(Locations.event == Events.select().where(Events.is_active == True).first())
    users_sightings = UserSightings.select(Users.display_name, Locations.display_name, fn.TIME(UserSightings.sighting_time)).join(Users).switch(UserSightings).join(Locations).where(UserSightings.sighting_time >= today).order_by(UserSightings.sighting_time.desc())

    firstmap = None
    first_map_record = Maps.select().where(Maps.event == Events.select().where(Events.is_active == True).first()).first()
    if first_map_record is not None:
        firstmap = "data:image/png;base64," + first_map_record.content

    return render_template('sightings.html', maps=maps, users=users, locations=locations, users_sightings=users_sightings, map = firstmap, user_is_admin = check_for_valid_admin_session())

@app.route('/chat')
def chat():
    if not check_for_valid_session():
        return redirect('/')

    return render_template('chat.html', chat_messages=ChatMessages.select(Users.display_name, fn.TIME(ChatMessages.sent_at), ChatMessages.message).join(Users).where(ChatMessages.sent_at >= datetime.today().date()).order_by(ChatMessages.sent_at.asc()), user_is_admin = check_for_valid_admin_session())

@app.route('/report_sighting', methods=['POST'])
def report_sighting():
    data = request.get_json()
    location_id = data['location_id']
    time = data['time']
    user = data['user']

    current_date = datetime.now().date()
    sighting_time = datetime.strptime(f'{current_date} {time}', '%Y-%m-%d %H:%M')

    active_event = Events.select().where(Events.is_active == True).first()

    if active_event is None:
        return jsonify({'status': 'error', 'message': 'Kein aktives Event gefunden!'})

    user_sightings = UserSightings(user_id=user, event_id=active_event, sighting_time=sighting_time, location_id=location_id)
    user_sightings.save()

    users_sightings = UserSightings.select(Users.display_name, Locations.display_name, UserSightings.sighting_time).join(Users).switch(UserSightings).join(Locations).order_by(UserSightings.sighting_time.desc())
    users_sightings = [sighting.to_dict() for sighting in users_sightings]

    return jsonify({'status': 'success', 'sightings': users_sightings})

@app.route('/get_new_sightings', methods=['GET'])
def get_new_sightings():
    current_time = datetime.now()
    one_minute_ago = current_time - timedelta(minutes=1)

    users_sightings = UserSightings.select(Users.display_name, Locations.display_name, UserSightings.sighting_time).join(Users).switch(UserSightings).join(Locations).where(UserSightings.sighting_time.between(one_minute_ago, current_time)).order_by(UserSightings.sighting_time.desc())
    users_sightings = [sighting.to_dict() for sighting in users_sightings]

    return jsonify({'status': 'success', 'users_sightings': users_sightings})

@app.route('/admin')
def admin():
    Database.init()

    if not check_for_valid_admin_session():
        return redirect('/')

    #create_dummy_data()
    events = Events.select().order_by(Events.display_name.asc())
    orderedEvents = Events.select().order_by(Events.is_active.desc())
    
    users = Users.select(Users.id, Users.user_name, Users.display_name, Events.id.alias('events')).join(UsersEvents).join(Events)

    Database.instance.close()

    return render_template('admin.html', events=events, orderedEvents=orderedEvents, users=users, user_is_admin = True)

@app.route('/delete_event', methods=['POST'])
def delete_event():
    data = request.get_json()
    event_id = data['event_id']

    UsersEvents.delete().where(UsersEvents.event == event_id).execute()
    Maps.delete().where(Maps.event == event_id).execute()
    UserSightings.delete().where(UserSightings.event == event_id).execute()
    Locations.delete().where(Locations.event == event_id).execute()
    Events.delete().where(Events.id == event_id).execute()

    return jsonify({'status': 'success'})

@app.route('/save_event', methods=['POST'])
def save_event():
    data = request.get_json()
    event_id = data['event_id']

    if event_id == "-1":
        event = Events(display_name=data['display_name'])
        event.save()
    else:
        event = Events.get(Events.id == event_id)
        event.display_name = data['display_name']
        event.save()

    return jsonify({'status': 'success', 'event_id': event.id})

@app.route('/get_event_data', methods=['POST'])
def get_event_data():
    data = request.get_json()
    event_id = data['event_id']

    maps, locations, users = get_maps_locations_users_by_event_id(event_id)
    maps = [map.to_dict() for map in maps]
    locations = [location.to_dict() for location in locations]

    return jsonify({'status': 'success', 'maps': maps, 'locations': locations})

@app.route('/change_active_event', methods=['POST'])
def change_active_event():
    data = request.get_json()
    event_id = data['event_id']

    Events.update(is_active=False).where(Events.is_active == True).execute()

    event = Events.get(Events.id == event_id)
    event.is_active = True
    event.save()

    return jsonify({'status': 'success'})

@app.route('/save_map', methods=['POST'])
def save_map():
    data = request.get_json()
    
    map_id = data['map_id']
    display_name = data['display_name']
    file = data['file']
    event_id = data['event_id']

    if map_id == "-1":
        map = Maps(display_name=display_name, content=file, event_id=event_id)
        map.save()
    else:
        map = Maps.get(Maps.id == map_id)
        map.display_name = data['display_name']

        if file != '':
            map.content = file

        map.save()

    return jsonify({'status': 'success', 'map_id': map.id})

@app.route('/delete_map', methods=['POST'])
def delete_map():
    data = request.get_json()
    map_id = data['map_id']

    Maps.delete().where(Maps.id == map_id).execute()

    return jsonify({'status': 'success'})

@app.route('/delete_location', methods=['POST'])
def delete_location():
    data = request.get_json()
    location_id = data['location_id']

    UserSightings.delete().where(UserSightings.location == location_id).execute()
    Locations.delete().where(Locations.id == location_id).execute()

    return jsonify({'status': 'success'})

@app.route('/save_location', methods=['POST'])
def save_location():
    data = request.get_json()
    location_id = data['location_id']

    if location_id == "-1":
        location = Locations(display_name=data['display_name'], event_id=data['event_id'])
        location.save()
    else:
        location = Locations.get(Locations.id == location_id)
        location.display_name = data['display_name']
        location.save()

    return jsonify({'status': 'success', 'location_id': location.id})

@app.route('/delete_user', methods=['POST'])
def delete_user():
    data = request.get_json()
    user_id = data['user_id']

    UserSightings.delete().where(UserSightings.user == user_id).execute()
    Users.delete().where(Users.id == user_id).execute()

    return jsonify({'status': 'success'})

@app.route('/save_user', methods=['POST'])
def save_user():
    data = request.get_json()
    user_id = data['user_id']
    event_ids = data['event_ids']
    display_name = data['display_name']
    user_name = data['user_name']
    password = data['password']

    if user_id == "-1":
        user = Users(display_name=display_name, user_name=user_name, user_password=password)
        user.save()
    else:
        user = Users.get(Users.id == user_id)
        user.display_name = display_name
        user.user_name = user_name 
        
        if password != "dummyPassword":
            user.user_password = password
        
        user.save()

    old_user_events = UsersEvents.select().where(UsersEvents.user == user.id)

    for event_id in event_ids:
        user_event = UsersEvents.select().where(UsersEvents.user == user.id, UsersEvents.event == event_id).first()

        if user_event is None:
            user_event = UsersEvents(user_id=user.id, event_id=int(event_id))
            user_event.save(force_insert=True)
        
        old_user_events = old_user_events.where(UsersEvents.event != event_id)

    for old_user_event in old_user_events:
        old_user_event.delete_instance()

    return jsonify({'status': 'success', 'user_id': user.id})

@app.route('/send_chat', methods=['POST'])
def send_chat():
    data = request.get_json()
    user = Users.get(Users.id == session['user_id'])
    sent_at = datetime.now()
    message = data['message']

    chat_message = ChatMessages(message=message, sent_at=sent_at, user_id=user.id)
    chat_message.save()

    return jsonify({'status': 'success', 'user': user.display_name})

@app.route('/get_new_chats', methods=['GET'])
def get_new_chats():
    current_time = datetime.now()
    one_minute_ago = current_time - timedelta(minutes=1)
    chat_messages = ChatMessages.select().join(Users).where(ChatMessages.sent_at.between(one_minute_ago, current_time)).order_by(ChatMessages.sent_at.asc())
    chat_messages = [message.to_dict() for message in chat_messages]

    return jsonify({'status': 'success', 'chat_messages': chat_messages})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
