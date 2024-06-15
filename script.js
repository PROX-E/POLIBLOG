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
};

function displayPosts(posts) {
    const postsDiv = document.getElementById('posts');
    postsDiv.innerHTML = '';
    posts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.className = 'post';
        postDiv.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p><p>${post.date}</p><button id="edit-button" style="display: none;">Edit</button> <button id="delete-post-button" style="display: none;>Delete</button>`;
        postsDiv.appendChild(postDiv);
    });
};

function checkLogin() {
    fetch('/check-login')
        .then(response => response.json())
        .then(data => {
            if (data.loggedIn) {
                document.getElementById('newPostSection').style.display = 'block';
                document.getElementById('logoutButton').style.display = 'block';
                document.getElementById('loginButton').style.display = 'none';
                document.getElementById('delete-post-button').style.display = 'block';
            } else {
                document.getElementById('newPostSection').style.display = 'none';
                document.getElementById('logoutButton').style.display = 'none';
                document.getElementById('loginButton').style.display = 'block';
                document.getElementById('delete-post-button').style.display = 'none';
            }
        });
};

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


document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    checkLogin();
});