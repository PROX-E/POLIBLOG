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

function loadPosts() {
    fetch('/posts')
        .then(response => response.json())
        .then(data => {
            displayPosts(data.posts);
        });
}

function checkLogin() {
    return fetch('/check-login')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                document.getElementById('newPostSection').style.display = 'block';
                document.getElementById('logoutButton').style.display = 'block';
                document.getElementById('loginButton').style.display = 'none';
                return true;
            } else {
                document.getElementById('newPostSection').style.display = 'none';
                document.getElementById('logoutButton').style.display = 'none';
                document.getElementById('loginButton').style.display = 'block';
                return false;
            }
        });
}

// Function to display posts
function displayPosts(posts) {
    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';
    checkLogin().then(isAdmin => {
        posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `
                <h3>${post.title}</h3>
                <p>${post.content}</p>
                <small>${post.date}</small>
                ${isAdmin ? `<button class="delete-button" data-id="${post.id}"><img src="images/trash.png" alt="Delete" class="delete-button-icon"></button>` : ''}
            `;
            postsDiv.appendChild(postDiv);
        });
    });
}

document.getElementById('logoutButton').addEventListener('click', function() {
    fetch('/logout', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            window.location.reload();
        } else {
            alert('Error logging out');
        }
    });
});

document.getElementById('searchForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('searchTitle').value;
    const date = document.getElementById('searchDate').value;
    const queryParams = new URLSearchParams({ title, date }).toString();
    window.location.href = `search-results.html?${queryParams}`;
});

// Function to handle delete post
function deletePost(postId) {
    fetch(`/delete-post/${postId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadPosts(); // Refresh posts after deletion
        } else {
            alert('Failed to delete post.');
        }
    });
}

// Event delegation for delete buttons
document.getElementById('posts').addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-button')) {
        const postId = event.target.getAttribute('data-id');
        deletePost(postId);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    checkLogin();
});