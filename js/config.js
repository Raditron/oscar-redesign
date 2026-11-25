/* Oscar Club — where the site finds its backend: the content API (backend/ in the repo), deployed on its own host.
   The bar's content that changes comes from there as each page loads (today the Saturday gig list on the home page).

   SET IT BEFORE UPLOADING: the backend's base URL, e.g. 'https://api.example.com'. The backend, in turn, must list
   the site's address in its CORS_ORIGINS. While this is empty the pages ask nothing of anyone: each part that shows
   the backend's content says it isn't available and gives the reservation phone.

   The tests point the pages at backends of their own with window.OC_API, set before this file runs (see js/main.js);
   there is no URL parameter for it, so nobody can point the live site somewhere else. */
window.OC_BACKEND = '';
