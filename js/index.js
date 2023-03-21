let userInfo;
let currentSidebarSelected = 'profile';
let currentRecipesSelected = 'all';
let categories;
let recipes;
let favorites = [];

async function load() {
    getCategories();
    // Favorites need a full list of recipes, so we need to wait for this to finish
    await getRecipes();
    await checkUser();  // checkUser needs to come after getRecipes because the hearts on the cards are authenticated-only
    getFavorites();

    // Create triggers
    document.getElementById('search-input').addEventListener('keypress', function(event) {
        if(event.key == "Enter") {
            search();
        }
    });
}

async function getCategories() {
    const responsePromise = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/get/categories`);
    const responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "success") {
        console.log("Successfully received categories!");
        console.log(responseJson['data']);
        categories = responseJson['data'];
    } else {
        console.log("Error retrieving categories");
    }
}

async function getRecipes(page=1, limit=10) {
    console.log("Loading recipes");
    // Default to page 1 and 10 per page
    const responsePromise = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/get/recipes?page=${page}&limit=${limit}`);
    let responseJson = JSON.parse(await responsePromise.text());

    console.log(responseJson);

    if(responseJson['status'] == "success") {
        console.log("Successfully received recipes!");
        console.log(`Retrieved ${responseJson['data'].length} recipes`);
        console.log(`There are ${responseJson['numRecipes']} recipes in this database`);
        console.log(`That means we will need ${responseJson['numRecipes']/limit} pages`);
        console.log(responseJson['data']);
        recipes = responseJson['data'];
    } else {
        console.error("Error retrieving recipes");
        return;
    }

    // Build recipe cards
    const cardArea = document.getElementById('all-recipes-area');
    cardArea.innerHTML = '';
    for(let i = 0; i < recipes.length; i++) {
        let card = buildRecipeCard(recipes[i]);
        cardArea.appendChild(card);
    }
    const testingDiv = document.createElement('div');
    testingDiv.innerHTML = '<div id="testing" style="height: 10000px"></div>';
    cardArea.appendChild(testingDiv);
}

async function checkUser() {
    // Check if user is authenticated in the backend
    let response = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/auth/check_authentication`, {credentials: 'include'});
    let data = JSON.parse(await response.text());
    
    // Default page shows unauthenticated user, so don't change anything
    if(!data['authenticated']) {
        return;
    }

    // Save user info globally
    userInfo = data['user'];

    // Update user panel
    updateUserPanel(userInfo['fname']);
    // Show all authenticated-only elements
    let authenticatedElements = document.getElementsByClassName('authenticated-only');
    for(let i = 0; i < authenticatedElements.length; i++) {
        authenticatedElements[i].style.display = 'inline-block';
    }
}

async function getFavorites() {
    // Check if user is authenticated
    if(userInfo == undefined) {
        return;
    }

    const responsePromise = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/get/favorites`, {credentials: 'include'});
    const responseJson = JSON.parse(await responsePromise.text());

    // Check status
    if(responseJson['status'] == "failure") {
        console.error("Error retrieving favorites");
        return;
    }

    // ResponseJson[data] should be an array of JSON objects, so let's turn it into an array
    const data = responseJson['data'];
    for(let i = 0; i < data.length; i++) {
        // Save ID globally
        favorites.push(data[i]['rec_id']);
        // Update button
        updateFavoriteButton(data[i]['rec_id']);
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
    console.log("Searching");
    searchTerm = document.getElementById('search-input').value;
    if(searchTerm.replace(" ", "").length == 0) {
        getRecipes();
        return;
    }

    let responsePromise = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/get/search?search=${searchTerm}`);
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
    getRecipes();
}

async function toggleItemFavoritism(id) {
    let result = favorites.includes(id) ? await removeFavorite(id) : await addFavorite(id);
    if(result['status'] == "success") {
        updateFavoriteButton(id);
        createFavoritesList();
    } else {
        console.error(result['message']);
    }   
}

async function addFavorite(id) {
    // Save favorite to database
    favorites.push(id);
    let favoriteResponse = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/post/favorite_item`, {
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

    return { status: "success", message: "Item saved successfully" };
}

async function removeFavorite(id) {
    // First, try to remove from server since that is the most likely to fail
    let unfavoriteResponse = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/post/unfavorite_item`, {
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
    // Get button
    button = document.getElementById('fav-button-' + id);

    oldIcon = button.children[0];

    // Create new icon
    i = document.createElement('i');
    i.classList.add('fav-button-icon');
    i.classList.add('fa-heart');

    // Check if item is already liked
    // If fa-solid, already liked
    oldIcon.classList.contains('fa-solid') ? i.classList.add('fa-regular') : i.classList.add('fa-solid');

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
        let recipeName = getRecipeName(favorites[i]);
        // If we don't have this recipe, just skip it
        if(recipeName == null) {
            continue;
        } else {
            favoritesList.appendChild(createFavoriteLI(favorites[i], recipeName));
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
    let tokensPromise = await fetch(`https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/auth/tokens`, {credentials: 'include'});
    let tokensJson = JSON.parse(await tokensPromise.text());

    // Write required fields for authentication request and encode necessary URI components
    let client_id='310858652520-c86lkcpu4bm3hb6mi3v80vh8qsc1pada.apps.googleusercontent.com';
    let response_type='code';
    let scope=encodeURIComponent('openid profile email');
    let redirect_uri=encodeURIComponent('https://www.recipe-test.jeffreycarr.dev/login', {credentials: 'include'});
    let state=`${tokensJson['CSRF']}`;
    let nonce = `${tokensJson['nonce']}`;

    // Write request to Google
    window.location.replace(`https://accounts.google.com/o/oauth2/v2/auth?response_type=${response_type}&client_id=${client_id}&scope=${scope}&redirect_uri=${redirect_uri}&state=${state}&nonce=${nonce}`);
}

async function logout() {
    // Send destroy notification to backend
    await fetch("https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/auth/logout", {credentials: 'include'});

    // Change user panel
    updateUserPanel();

    // Hide authenticated only items
    // Show all authenticated-only elements
    let authenticatedElements = document.getElementsByClassName('authenticated-only');
    console.log(authenticatedElements);
    for(let i = 0; i < authenticatedElements.length; i++) {
        authenticatedElements[i].style.display = 'none';
    }

    // Set all recipes as selected just in case user was sitting on their recipe page
    document.getElementById('all-recipes-button').classList.add('recipe-button-selected');
    document.getElementById('all-recipes-area').classList.add('recipe-area-selected');
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
        createButton.onclick = () => {window.location.replace('https://www.recipe-test.jeffreycarr.dev/create')};
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
    const currentRecipesArea = document.getElementById(`${currentRecipesSelected}-recipes-area`);

    // Get new elements
    const newRecipesButton = document.getElementById(`${area}-recipes-button`);
    const newRecipesArea = document.getElementById(`${area}-recipes-area`);

    // Remove selected class from current element
    currentRecipesButton.classList.remove('recipe-button-selected');
    currentRecipesArea.classList.remove('recipe-area-selected');

    // Add classes to new element
    newRecipesButton.classList.add('recipe-button-selected');
    newRecipesArea.classList.add('recipe-area-selected');

    currentRecipesSelected = area;
}

async function pickRandomRecipe() {
    console.log("Picking random recipe");

    // Show loading message
    const randomRecipeContainer = document.getElementById('random-recipe-container');
    randomRecipeContainer.innerHTML = '';
    randomRecipeContainer.innerText = "Gather ingredients...";

    let responsePromise = await fetch('https://recipe-book-backend-test-yal6zyrksa-ue.a.run.app/api/get/random');
    let responseJson = JSON.parse(await responsePromise.text());

    console.log(responseJson);

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
