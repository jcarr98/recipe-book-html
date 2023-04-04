let userInfo, categories, recipes, totalRecipes;
// Favorites is List of recipes ids, favoriteNames is Object of id:names
// Keep a separate list of just favorite ids because we use .includes a lot
let favorites, favoritesNames;
let currentSidebarSelected = 'profile';  // Defaults to profile section
let currentRecipesSelected = 'all';  // Defaults to showing all recipes
const url = new URL(window.location.href);

async function load() {
    // Get all our categories
    getCategories();

    // Get everything recipe related
    loadRecipes();

    // Create triggers
    document.getElementById('search-input').addEventListener('keypress', function(event) {
        if(event.key == "Enter") {
            search();
        }
    });
}

async function getCategories() {
    const responsePromise = await fetch(`https://localhost:5001/api/get/categories`);
    const responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "success") {
        categories = responseJson['data'];
    } else {
        console.error("Error retrieving categories");
    }
}

/** Run every method that is required when loading recipe items
 * 
 * Because we have multiple times we need to load the recipes (on page load, changing page, specifying author), we will need to call
 * all these functions multiple times. It is easier to just include one function call than remembering all functions are need calling
 */
async function loadRecipes() {
    await getRecipes();
    await checkUser();
    // To avoid querying the database on each recipe view change, check if we already have this data saved
    if(favorites == undefined) {
        await getFavorites();
    }
    
    // Build recipe cards
    let cardArea;
    let author = currentRecipesSelected == "your" ? userInfo['user_id'] : null;
    if(author != null) {
        cardArea = document.getElementById('your-recipes-area');
    } else {
        cardArea = document.getElementById('all-recipes-area');
    }

    cardArea.innerHTML = '';

    // If we have no recipes, display message
    if(recipes.length == 0) {
        cardArea.innerHTML = '<p>No recipes to show :(</p>';
    } else {
        for(let i = 0; i < recipes.length; i++) {
            let recipe = recipes[i];
            let card = buildRecipeCard(recipe, (favorites.includes(recipe['rec_id'])));
            cardArea.appendChild(card);
        }
    }

    toggleAuthenticatedItems();
}

async function getRecipes() {
    // Get the page number and how many to display per page
    // Default to page 1 and 10 per page
    let page = url.searchParams.get('page') == null ? 1 : url.searchParams.get('page');
    let limit = url.searchParams.get('perPage') == null ? 10 : url.searchParams.get('perPage');
    let author = currentRecipesSelected == "your" ? userInfo['user_id'] : null;

    let query = `https://localhost:5001/api/get/recipes?page=${page}&limit=${limit}`;
    if(author != null) {
        query = query + "&author=" + author;
    }

    const responsePromise = await fetch(query);
    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "success") {
        totalRecipes = responseJson['numRecipes']
        recipes = responseJson['data'];
    } else {
        console.error("Error retrieving recipes");
        return;
    }

    showPageination();
}

function showPageination() {
    let currentPage = url.searchParams.get('page') == null ? 1 : url.searchParams.get('page');
    let perPage = url.searchParams.get('perPage') == null ? 10 : url.searchParams.get('perPage');

    const totalButtons = Math.ceil(totalRecipes/perPage);
    const pageinationContainer = document.getElementById(`${currentRecipesSelected}-pageination-container`);
    pageinationContainer.innerHTML = '';
    
    // Start i=1. I know, it's gross but it'll be useful
    for(let i=1; i < totalButtons+1; i++) {
        pageinationContainer.appendChild(buildPageinationButton(i, (i == currentPage)));
    }
}

async function checkUser() {
    // Check if user is authenticated in the backend
    let response = await fetch(`https://localhost:5001/auth/check_authentication`, {credentials: 'include'});
    let data = JSON.parse(await response.text());
    
    // Default page shows unauthenticated user, so don't change anything
    if(!data['authenticated']) {
        return;
    }

    // Save user info globally
    userInfo = data['user'];

    // Update user panel
    updateUserPanel(userInfo['fname']);
}

async function getFavorites() {
    // Check if user is authenticated
    if(userInfo == undefined) {
        favorites = [];
        return;
    }

    const responsePromise = await fetch(`https://localhost:5001/api/get/favorites`, {credentials: 'include'});
    const responseJson = JSON.parse(await responsePromise.text());

    // Check status
    if(responseJson['status'] != "success") {
        console.error("Error retrieving favorites");
        return;
    }

    // ResponseJson[data] should be an array of JSON objects, so let's turn it into an array
    const data = responseJson['data'];
    favorites = [], favoritesNames = {};
    for(let i = 0; i < data.length; i++) {
        // Save ID globally
        favoritesNames[data[i]['rec_id']] = data[i]['name'];
        favorites.push(data[i]['rec_id']);
    }

    createFavoritesList();
}

function switchSidebar(area) {
    // Get currently selected area
    let currentButton = document.getElementById(currentSidebarSelected + '-button');
    let currentBody = document.getElementById(currentSidebarSelected + '-body');
    // Get area to select
    let newButton = document.getElementById(area + '-button');
    let newBody = document.getElementById(area + '-body');

    // Set current area back to default
    currentButton.style.backgroundColor = 'var(--tertiary)';
    currentButton.style.border = 'none';
    currentBody.style.display = 'none';

    // Update new area
    newButton.style.backgroundColor = 'var(--primary)';
    newButton.style.border = '1px solid var(--alternate)';
    newButton.style.borderBottom = 'none';
    newBody.style.display = 'flex';

    // Update area
    currentSidebarSelected = area;
}

function addFilter() {
    filterArea = document.getElementById('filter-display-area');
    i = filterArea.childElementCount;

    // Create small filter
    p = document.createElement('p');
    p.innerText = 'Filter ' + i;
    filterArea.appendChild(p);
}

async function search() {
    searchTerm = document.getElementById('search-input').value;

    // Used for reset
    if(searchTerm.replace(" ", "").length == 0) {
        loadRecipes();
        return;
    }

    let responsePromise = await fetch(`https://localhost:5001/api/get/search?search=${searchTerm}`);
    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "failure") {
        console.error("Error retrieving search results");
        return;
    }

    let searchResults = responseJson['data'];
    const cardArea = document.getElementById('all-recipes-area');
    cardArea.innerHTML = '';
    for(let i=0; i < searchResults.length; i++) {
        let card = buildRecipeCard(searchResults[i]);
        cardArea.append(card);
    }
}

function resetSearch() {
    document.getElementById('search-input').value = '';
    loadRecipes();
}

async function toggleItemFavoritism(id) {
    // Set favorite button to loading
    await setFavoriteLoading(id);

    let result = favorites.includes(id) ? await removeFavorite(id) : await addFavorite(id);
    
    if(result['status'] == "success") {
        updateFavoriteButton(id);
        createFavoritesList();
    }
}

async function setFavoriteLoading(id) {
    const favoriteButton = document.getElementById(`fav-button-${id}`);

    // Check if this favorite button is on the page
    if(favoriteButton == undefined) {
        // This could happen if a user clicks the delete button in the favorites list
        // When the favorite item is on another page
        return;
    } else {
        favoriteButton.innerHTML = '<img src="./images/loading.svg">';
    }

    // WHAT IS THIS???
    // If the server is _too_ responsive, changing to a loading symbol looks jittery, so let's just ensure it doesn't
    // Sorry user...
    await new Promise(r => setTimeout(r, 150));
}

async function addFavorite(id) {
    // Save favorite to database
    let favoriteResponse = await fetch(`https://localhost:5001/api/post/favorite_item`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'id': id })
    });
    let favoriteJson = JSON.parse(await favoriteResponse.text());

    if(favoriteJson['status'] != "success") {
        return { status: "failure", message: "Error favoriting item" };
    }

    // Save favorite info to object
    let recipeName = getRecipeName(id);
    favoritesNames[id] = recipeName;
    // Save favorite to list
    favorites.push(id);

    return { status: "success", message: "Item saved successfully" };
}

async function removeFavorite(id) {
    // First, try to remove from server since that is the most likely to fail
    let unfavoriteResponse = await fetch(`https://localhost:5001/api/post/unfavorite_item`, {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 'id': id })
    });
    let unfavoriteJson = JSON.parse(await unfavoriteResponse.text());

    // Check for errors
    if(unfavoriteJson['status'] == 'failure') {
        console.error("Error removing favorite");
        return { status: "failure", message: "Error removing favorite" };
    }

    // Remove favorite from all relevant arrays
    delete favoritesNames[id];
    favorites.splice(favorites.indexOf(id), 1);
    // In theory, should be same index in both arrays, but to be safe we'll do our own iteration
    for(let i = 0; i < favorites.length; i++) {
        if(favorites[i]['id'] == id) {
            favorites.splice(i, 1);
            break;
        }
    }

    return { status: "success", message: "Favorite removed successfully" };
}

function updateFavoriteButton(id) {
    let button = document.getElementById('fav-button-' + id);

    // Check if this favorite button is on the page
    if(button == undefined) {
        // This could happen if a user clicks the delete button in the favorites list
        // When the favorite item is on another page
        return;
    }

    // Create new icon
    i = document.createElement('i');
    i.classList.add('fav-button-icon');
    i.classList.add('fa-heart');

    // Check if item is already liked
    favorites.includes(id) ? i.classList.add('fa-solid') : i.classList.add('fa-regular');

    // Clear old icon
    button.innerHTML = '';

    // Add new icon
    button.appendChild(i);
}

function createFavoritesList() {
    // Get favorites list area
    const favoritesArea = document.getElementById('favorites-area');

    // Check if there are any favorited items
    if(favorites.length == 0) {
        favoritesArea.innerHTML = "No favorites to show.";
        return
    } else {
        // Clear current text
        favoritesArea.innerHTML = '';
    }

    let favoritesList = document.createElement('ul');

    // Create a list item for each favorited recipe
    for(let i = 0; i < favorites.length; i++) {
        let favId = favorites[i];
        let recipeName = favoritesNames[favId];
        // If we don't have this recipe, just skip it
        if(recipeName == null) {
            continue;
        } else {
            favoritesList.appendChild(createFavoriteLI(favId, recipeName));
        }
    }

    favoritesArea.appendChild(favoritesList);
}

function getRecipeName(id) {
    for(let i=0; i < recipes.length; i++) {
        if(recipes[i]['rec_id'] == id) {
            return recipes[i]['recipe_name'];
        }
    }

    return null;
}

async function login() {
    // First, get CSRF and nonce from backend
    let tokensPromise = await fetch(`https://localhost:5001/auth/tokens`, {credentials: 'include'});
    let tokensJson = JSON.parse(await tokensPromise.text());

    // Write required fields for authentication request and encode necessary URI components
    let client_id='310858652520-c86lkcpu4bm3hb6mi3v80vh8qsc1pada.apps.googleusercontent.com';
    let response_type='code';
    let scope=encodeURIComponent('openid profile email');
    let redirect_uri=encodeURIComponent('https://localhost:5500/login.html', {credentials: 'include'});
    let state=`${tokensJson['CSRF']}`;
    let nonce = `${tokensJson['nonce']}`;

    // Write request to Google
    window.location.replace(`https://accounts.google.com/o/oauth2/v2/auth?response_type=${response_type}&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}&nonce=${nonce}`);
}

async function logout() {
    // Send destroy notification to backend
    await fetch("https://localhost:5001/auth/logout", {credentials: 'include'});

    // Remove all user info
    userInfo = undefined;

    // Change user panel
    updateUserPanel();

    // Hide authenticated only items
    toggleAuthenticatedItems();

    // Set all recipes as selected just in case user was sitting on their recipe page
    switchRecipeView('all');
}

function updateUserPanel(username=null) {
    // Update user section
    let userArea = document.getElementById('profile-body');

    // Clear current elements
    userArea.innerHTML = '';

    // Create new intro
    let greeting = document.createElement('h2');
    greeting.innerText = username == null ? "Hello, User" : `Hello, ${username}`;
    userArea.appendChild(greeting);

    // Create auth button
    let authButton = document.createElement('button');
    if(username == null) {
        authButton.classList.add('standard-button');
        authButton.innerText = "Sign in with Google";
        authButton.onclick = login;
    } else {
        // Authenticated users can create recipes
        let createButton = document.createElement('button');
        createButton.classList.add('standard-button');
        createButton.innerText = 'Create New Recipe';
        createButton.style.marginBottom = '1em';
        createButton.onclick = () => {window.location.replace('https://localhost:5500/create.html')};
        userArea.appendChild(createButton);

        authButton.classList.add('plain-button');
        authButton.innerText = "Logout";
        authButton.onclick = logout;
    }
    
    // Clear out current area
    userArea.appendChild(authButton);
}

function switchRecipeView(area) {
    // Get current elements
    const currentRecipesButton = document.getElementById(`${currentRecipesSelected}-recipes-button`);
    const currentRecipesArea = document.getElementById(`${currentRecipesSelected}-recipes-container`);

    // Get new elements
    const newRecipesButton = document.getElementById(`${area}-recipes-button`);
    const newRecipesArea = document.getElementById(`${area}-recipes-container`);

    // Remove selected class from current element
    currentRecipesButton.classList.remove('recipe-button-selected');
    currentRecipesArea.classList.remove('recipe-container-selected');

    // Add classes to new element
    newRecipesButton.classList.add('recipe-button-selected');
    newRecipesArea.classList.add('recipe-container-selected');

    currentRecipesSelected = area;

    // Reset url parameters
    url.searchParams.set('page', 1); window.history.replaceState(null, null, url);

    // Load recipes
    loadRecipes();
}

async function pickRandomRecipe() {
    // Show loading message
    const randomRecipeContainer = document.getElementById('random-recipe-container');
    randomRecipeContainer.innerHTML = '';
    randomRecipeContainer.innerText = "Gather ingredients...";

    let responsePromise = await fetch('https://localhost:5001/api/get/random');
    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "failure") {
        console.error("Error retrieving a random recipe");
    } else {
        randomRecipeContainer.innerHTML = '';
        randomRecipeContainer.innerText = "And your chef has cooked up...";
        let recipeId = responseJson['data']['rec_id'];
        let recipeName = responseJson['data']['recipe_name'];
        randomRecipeContainer.appendChild(createRandomRecipeLink(recipeId, recipeName));
    }
}

function toggleAuthenticatedItems() {
    // Show all authenticated-only elements
    const authenticatedElements = document.getElementsByClassName('authenticated-only');
    const displayType = (userInfo != undefined) ? 'inline-block' : 'none';


    for(let i = 0; i < authenticatedElements.length; i++) {
        authenticatedElements[i].style.display = displayType;
    }
}