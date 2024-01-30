document.getElementById('sendButton').addEventListener('click', function() {
    var messageInput = document.getElementById('message-input');
    var message = messageInput.value;

    fetch('/send_chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
        }),
    })
    .then(response => response.json())
    .then(data => {
        var chatTable = document.getElementById('chat-box');
        
        var messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        var p1 = document.createElement('p');
        p1.classList.add('message-user');
        p1.textContent = data.user;
        var p2 = document.createElement('p');
        p2.textContent = message;
        p2.classList.add('message-text');
        var p3 = document.createElement('p');
        p3.textContent = new Date().toLocaleTimeString("de-de", { hour: "2-digit", minute: "2-digit", second: "2-digit"});
        p3.classList.add('message-time');

        messageDiv.appendChild(p1);
        messageDiv.appendChild(p2);
        messageDiv.appendChild(p3);

        chatTable.appendChild(messageDiv);
        
        messageInput.value = '';
    })
    .catch((error) => {
        console.error('Error:', error);
    });
    event.preventDefault()
});
