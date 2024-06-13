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
});