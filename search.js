document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('title');
    const date = urlParams.get('date');

    fetch(`/search-posts?title=${encodeURIComponent(title)}&date=${encodeURIComponent(date)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displaySearchResults(data.posts);
            } else {
                alert('Error searching posts');
            }
        });

    function displaySearchResults(posts) {
        const searchResultsDiv = document.getElementById('searchResults');
        searchResultsDiv.innerHTML = '';
        if (posts.length === 0) {
            searchResultsDiv.innerHTML = '<p>No posts found</p>';
            return;
        }
        posts.forEach(post => {
            const postDiv = document.createElement('div');
            postDiv.className = 'post';
            postDiv.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p><p>${post.date}</p>`;
            searchResultsDiv.appendChild(postDiv);
        });
    }
});