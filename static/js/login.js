document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form submission
    
    // Get the values entered by the user
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;
    
    if (username.trim() === '' || password.trim() === '') {
        alert('Please enter both username and password');
        return;
    }
    
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.href = '/sightings';
        } else {
            alert(data.message);
        }
    })
});

