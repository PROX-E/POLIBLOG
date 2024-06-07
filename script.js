document.getElementById('postForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    fetch('/add-post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPosts();
        } else {
            alert('Error adding post');
        }
    });
});