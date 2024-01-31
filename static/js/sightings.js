document.getElementById('sightingButton').addEventListener('click', function() {
    var locationId = document.getElementById('sightingLocation').value;
    var time = document.getElementById('sightingTime').value;
    var user= document.getElementById('sightedUser').value;

    fetch('/report_sighting', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            location_id: locationId,
            time: time,
            user: user,
        }),
    })
    .then(response => response.json())
    .then(data => {
        var usersSightingsTable = document.getElementById('users_sightings');
    
        // Clear the current contents of the table
        while (usersSightingsTable.lastChild && usersSightingsTable.children.length > 1) {
            usersSightingsTable.removeChild(usersSightingsTable.lastChild);
        }
    
        // Add each sighting from data.sightings
        data.sightings.forEach(sighting => {
            var row = usersSightingsTable.insertRow();
    
            var userCell = row.insertCell();
            var locationCell = row.insertCell();
            var timeCell = row.insertCell();
    
            userCell.textContent = sighting.user;
            locationCell.textContent = sighting.location;
            timeCell.textContent = sighting.sighting_time;
        });

        console.log('Success:', data.status);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

document.getElementById('map').addEventListener('change', function() {
    var selectElement = document.getElementById('map');
    var mapImage = document.getElementById('mapImage');

    var selectedOptions = selectElement.options[selectElement.selectedIndex];

    mapImage.src = "data:image/png;base64," + selectedOptions.dataset.file;
});

function fetchNewSightings() {
    fetch('/get_new_sightings')
    .then(response => response.json())
    .then(data => {
        data.sightings.forEach(function(sighting) {
            var usersSightingsTable = document.getElementById('users_sightings');
    
            var row = usersSightingsTable.insertRow();
    
            var userCell = row.insertCell();
            var locationCell = row.insertCell();
            var timeCell = row.insertCell();
    
            userCell.textContent = sighting.user;
            locationCell.textContent = sighting.location;
            timeCell.textContent = sighting.sighting_time;
        });
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

setInterval(fetchNewSightings, 60000);
