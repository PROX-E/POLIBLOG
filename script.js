const BASE_URL = 'https://solorgenergy.com'; // Update to your server's URL

document.getElementById('postForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    fetch(`${BASE_URL}/add-post`, {
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
    fetch(`${BASE_URL}/posts`)
        .then(response => response.json())
        .then(data => {
            displayPosts(data.posts);
        });
}

function checkLogin() {
    return fetch(`${BASE_URL}/public_html/check-login`)
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
                ${isAdmin ? `<button class="delete-button" data-id="${post.id}">Delete</button>` : ''}
                ${isAdmin ? `<button class="edit-button" data-id="${post.id}">Edit</button>` : ''}
            `;
            postsDiv.appendChild(postDiv);
        });
    });
}

document.getElementById('logoutButton').addEventListener('click', function () {
    fetch(`${BASE_URL}/logout`, {
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

document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('searchTitle').value;
    const date = document.getElementById('searchDate').value;
    const queryParams = new URLSearchParams({ title, date }).toString();
    window.location.href = `search-results.html?${queryParams}`;
});

// Function to handle delete post
function deletePost(postId) {
    fetch(`${BASE_URL}/delete-post/${postId}`, {
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
    } else if (event.target.classList.contains('edit-button')) {
        const postId = event.target.getAttribute('data-id');
        editPost(postId);
    }
});

// Function to handle editing a post
function editPost(postId) {
    const postDiv = document.querySelector(`button[data-id="${postId}"]`).parentElement;
    const title = postDiv.querySelector('h3').innerText;
    const content = postDiv.querySelector('p').innerText;

    const editFormHtml = `
        <form class="edit-post-form">
            <input type="text" value="${title}" id="edit-title-${postId}" required><br>
            <textarea id="edit-content-${postId}" required>${content}</textarea><br>
            <button type="submit">Save</button>
            <button type="button" onclick="cancelEdit(${postId})">Cancel</button>
        </form>
    `;
    postDiv.innerHTML = editFormHtml;

    postDiv.querySelector('.edit-post-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const newTitle = document.getElementById(`edit-title-${postId}`).value;
        const newContent = document.getElementById(`edit-content-${postId}`).value;

        fetch(`${BASE_URL}/edit-post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: newTitle, content: newContent })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadPosts(); // Refresh posts after editing
            } else {
                alert('Failed to edit post.');
            }
        });
    });
}

// Function to cancel editing a post
function cancelEdit(postId) {
    loadPosts(); // Reload posts to revert changes
}

// Load posts and check login status when the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    loadPosts();
    checkLogin();
});