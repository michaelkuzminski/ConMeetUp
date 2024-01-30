//Event
document.getElementById('eventDeleteButton').addEventListener('click', function() {
    var eventId = document.getElementById('event').value;

    console.log(eventId);

    if(eventId.trim() === '-1') {
        alert('Please select an event to delete');
        return;
    } else {
        fetch('/delete_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id: eventId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = '/admin';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('eventSaveButton').addEventListener('click', function() {
    var selectElement = document.getElementById('event');
    var eventId = selectElement.value;
    var nameEntry = document.getElementById('eventNameEntry');

    if(nameEntry.value.trim() === '') {
        alert('Bitte geben Sie einen Namen für das Event ein');
        return;
    } else {
        fetch('/save_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id: eventId,
                display_name: nameEntry.value,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (eventId === '-1') {
                var newOption = document.createElement('option');
                newOption.value = data.event_id;
                newOption.text = nameEntry.value; 
                selectElement.appendChild(newOption);
                selectElement.selectedIndex = selectElement.options.length -1;
            } else {
                selectElement.options[selectElement.selectedIndex].text = nameEntry.value;
            }
            nameEntry.value = '';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('event').addEventListener('change', function() {
    var selectElement = document.getElementById('event');
    var nameEntry = document.getElementById('eventNameEntry');

    var eventId = selectElement.value;
    var selectedItemText = selectElement.options[selectElement.selectedIndex].text;

    if (eventId.trim() === '-1') {
        document.getElementById('eventDeleteRow').setAttribute("hidden", true);
        var hideableElements = document.getElementsByClassName('hideable');
        for (var i = 0; i < hideableElements.length; i++) {
            hideableElements[i].setAttribute("hidden", true);
        }
        nameEntry.value = '';
    } else {
        document.getElementById('eventDeleteRow').removeAttribute("hidden");
        var hideableElements = document.getElementsByClassName('hideable');
        for (var i = 0; i < hideableElements.length; i++) {
            hideableElements[i].removeAttribute("hidden");
        }
        fetch('/get_event_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_id: eventId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            locationSelect = document.getElementById('location');
            locationSelect.innerHTML = '';
            mapSelect = document.getElementById('map');
            mapSelect.innerHTML = '';

            var option = document.createElement('option');
            option.value = -1;
            option.text = "Neue Räumlichkeit";
            locationSelect.appendChild(option);
            for (var i = 0; i < data.locations.length; i++) {
                option = document.createElement('option');
                option.value = data.locations[i].id;
                option.text = data.locations[i].display_name;
                locationSelect.appendChild(option);
            }

            option = document.createElement('option');
            option.value = -1;
            option.text = "Neue Karte";
            mapSelect.appendChild(option);
            for (var i = 0; i < data.maps.length; i++) {
                option = document.createElement('option');
                console.log(data.maps[i]);
                option.value = data.maps[i].id;
                option.text = data.maps[i].display_name;
                option.dataset.file = data.maps[i].content;
                document.getElementById('map').appendChild(option);
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });

        nameEntry.value = selectedItemText;
    }
});

document.getElementById('activeEvent').addEventListener('change', function() {
    var selectElement = document.getElementById('activeEvent');

    var eventId = selectElement.value;

    fetch('/change_active_event', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            event_id: eventId,
        }),
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

//Map
document.getElementById('mapDeleteButton').addEventListener('click', function() {
    var mapId = document.getElementById('map').value;

    console.log(mapId);

    if(mapId.trim() === '-1') {
        alert('Bitte wählen Sie eine Karte zum Löschen aus');
        return;
    } else {
        fetch('/delete_map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                map_id: mapId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = '/admin';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('mapSaveButton').addEventListener('click', function() {
    var selectElement = document.getElementById('map');
    var mapId = selectElement.value;
    var eventId = document.getElementById('event').value;
    var nameEntry = document.getElementById('mapNameEntry');
    var fileValue = document.getElementById('mapFileEntry').files[0];

    if (fileValue === undefined && mapId === '-1') {
        alert('Bitte wählen Sie eine Datei für die Karte aus');
        return;
    } else if (fileValue === undefined) {
        fileValue = new File([], 'empty'); // Create an empty file
    }

    if (nameEntry.value.trim() === '') {
        alert('Bitte geben Sie einen Namen für die Karte ein');
        return;
    } else {
        var reader = new FileReader();
        reader.onload = function(event) {
            if(event.target.result !== undefined) {
                var base64FileData = event.target.result.split(',')[1]; // Get the Base64 string, remove the data URL prefix
            } else {
                var base64FileData = ''; // Set an empty string as the file data
            }
            fetch('/save_map', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    map_id: mapId,
                    display_name: nameEntry.value,
                    event_id: eventId,
                    file: base64FileData,
                }),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (mapId === '-1') {
                    var newOption = document.createElement('option');
                    newOption.value = data.map_id;
                    newOption.text = nameEntry.value; 
                    selectElement.appendChild(newOption);
                    selectElement.selectedIndex = selectElement.options.length -1;
                } else {
                    selectElement.options[selectElement.selectedIndex].text = nameEntry.value;
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        };
        reader.readAsDataURL(fileValue); // Read the file as a Base64 encoded string

        // Force the reader to load an empty file
        if (fileValue.size === 0) {
            reader.onloadend = function() {
                var base64FileData = ''; // Set an empty string as the file data
                reader.result = 'data:;base64,' + base64FileData;
            };
        }
    }
});

document.getElementById('map').addEventListener('change', function() {
    var selectElement = document.getElementById('map');
    var deleteButton = document.getElementById('mapDeleteButton');
    var nameEntry = document.getElementById('mapNameEntry');
    var mapImage = document.getElementById('mapImage');

    var mapId = selectElement.value;
    var selectedOptions = selectElement.options[selectElement.selectedIndex];
    var selectedItemText = selectedOptions.text;

    if (mapId.trim() === '-1') {
        deleteButton.setAttribute("hidden", true);
        nameEntry.value = '';
        mapImage.src = '';
    } else {
        deleteButton.removeAttribute("hidden");
        mapImage.src = "data:image/png;base64," + selectedOptions.dataset.file;
        nameEntry.value = selectedItemText;
    }
});

//Location
document.getElementById('locationDeleteButton').addEventListener('click', function() {
    var locationId = document.getElementById('location').value;

    console.log(locationId);

    if(locationId.trim() === '-1') {
        alert('Bitte wählen Sie einen Ort zum Löschen aus');
        return;
    } else {
        fetch('/delete_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location_id: locationId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            window.location.href = '/admin';
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('locationSaveButton').addEventListener('click', function() {
    var selectElement = document.getElementById('location');
    var locationId = selectElement.value;
    var eventId = document.getElementById('event').value;
    var nameEntry = document.getElementById('locationNameEntry');

    if(nameEntry.value.trim() === '') {
        alert('Bitte geben Sie einen Namen für den Ort ein');
        return;
    } else {
        fetch('/save_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                location_id: locationId,
                display_name: nameEntry.value,
                event_id: eventId,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(locationId);
            if (locationId === '-1') {
                var newOption = document.createElement('option');
                newOption.value = data.location_id;
                newOption.text = nameEntry.value; 
                selectElement.appendChild(newOption);
                selectElement.selectedIndex = selectElement.options.length -1;
            } else {
                selectElement.options[selectElement.selectedIndex].text = nameEntry.value;
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('location').addEventListener('change', function() {
    var selectElement = document.getElementById('location');
    var deleteButton = document.getElementById('locationDeleteButton');
    var nameEntry = document.getElementById('locationNameEntry');

    var locationId = selectElement.value;
    var selectedItemText = selectElement.options[selectElement.selectedIndex].text;

    if (locationId.trim() === '-1') {
        deleteButton.setAttribute("hidden", true);
        nameEntry.value = '';
    } else {
        console.log(deleteButton);
        deleteButton.removeAttribute("hidden");
        nameEntry.value = selectedItemText;
    }
});

//User
document.getElementById('userDeleteButton').addEventListener('click', function() {
    var selectElement = document.getElementById('user');
    var userId = selectElement.value;

    if(userId.trim() === '-1') {
        alert('Bitte wählen Sie einen Benutzer zum Löschen aus');
        return;
    } else {
        fetch('/delete_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
            }),
        })
        .then(response => response.json())
        .then(()=> {
            selectElement.options[selectElement.selectedIndex].remove();
            selectElement.selectedIndex = 0;
            selectElement.dispatchEvent(new Event('change'));
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('userSaveButton').addEventListener('click', function() {
    var selectElement = document.getElementById('user');
    var events = document.getElementById('events');
    var eventIds = Array.from(events.selectedOptions).map(option => option.value);
    var loginEntry = document.getElementById('userLoginEntry');
    var nameEntry = document.getElementById('userNameEntry');
    var passwordEntry = document.getElementById('userPasswordEntry');

    if(nameEntry.value.trim() === '' || nameEntry.value.trim() === '' || passwordEntry.value.trim() === '') {
        alert('Bitte geben Sie alle nötigen Daten für den Benutzer ein');
        return;
    } else {
        fetch('/save_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: selectElement.value,
                event_ids: eventIds,
                display_name: nameEntry.value,
                user_name: loginEntry.value,
                password: passwordEntry.value,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (selectElement.value !== '-1') {
                selectElement.options[selectElement.selectedIndex].text = nameEntry.value;
                selectElement.options[selectElement.selectedIndex].dataset.username = loginEntry.value;
                selectElement.options[selectElement.selectedIndex].dataset.events = eventIds;
            } else  {
                var newOption = document.createElement('option');
                newOption.value = data.user_id;
                newOption.text = nameEntry.value; 
                newOption.dataset.username = loginEntry.value;
                newOption.dataset.events = eventIds;

                selectElement.appendChild(newOption);
                selectElement.selectedIndex = selectElement.options.length -1;
            };

            passwordEntry.value = '';
            loginEntry.value = '';
            nameEntry.value = '';
            document.getElementById('events').value = []; 
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
});

document.getElementById('user').addEventListener('change', function() {
    var selectElement = document.getElementById('user');
    var deleteButton = document.getElementById('userDeleteButton');
    var nameEntry = document.getElementById('userNameEntry');
    var loginEntry = document.getElementById('userLoginEntry');
    var passwordEntry = document.getElementById('userPasswordEntry');
    var events = document.getElementById('events');

    var userId = selectElement.value;
    var selectedItem = selectElement.options[selectElement.selectedIndex];
    var selectedItemText = selectedItem.text;

    if (userId.trim() === '-1') {
        deleteButton.setAttribute("hidden", true);
        nameEntry.value = '';
        loginEntry.value = '';
        passwordEntry.value = '';
        events.selectedItems = [];
    } else {
        deleteButton.removeAttribute("hidden");
        nameEntry.value = selectedItemText;
        loginEntry.value = selectedItem.dataset.username;
        passwordEntry.value = 'dummyPassword';
        console.log('allo')
        console.log(selectedItem.dataset.events);
        events.selectedItems = selectedItem.dataset.events;
    }
});