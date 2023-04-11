let userInfo, categories = [], recipes = [], authors = [], totalRecipes = 0;
let filteredCategories = [], filteredAuthors = [];
// Favorites is List of recipes ids, favoriteNames is Object of id:names
// Keep a separate list of just favorite ids because we use .includes a lot
let favorites, favoritesNames;
let currentSidebarSelected = 'profile';  // Defaults to profile section
let currentRecipesSelected = 'all';  // Defaults to showing all recipes
const url = new URL(window.location.href);

async function load() {
    // Check for messages
    displayMessages();

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

function displayMessages() {
    if(url.searchParams.get("success")) {
        displayMessage("success", url.searchParams.get("success"));
    }
    if(url.searchParams.get("error")) {
        displayMessage("error",  url.searchParams.get("error"));
    }
}

async function getCategories() {
    let responsePromise;
    try {
        responsePromise = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/categories`);
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return;
    }
    const responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "success") {
        categories = responseJson['data'];
    } else {
        displayMessages("error", "Error loading categories");
        return;
    }

    // Put categories in modal
    let categoryTable = document.getElementById('category-filter-table');
    for(let i=0; i < categories.length; i++) {
        let tr = document.createElement('tr');
        let categoryLabel = `<td>${categories[i]['name']}</td>`;
        let categoryCheckbox = `<td><input type="checkbox" id=cat-${i} name=cat-${i} /></td>`;
        tr.innerHTML = categoryLabel + categoryCheckbox;
        categoryTable.appendChild(tr);
    }
}

/** Run every method that is required when loading recipe items
 * 
 * Because we have multiple times we need to load the recipes (on page load, changing page, specifying author), we will need to call
 * all these functions multiple times. It is easier to just include one function call than remembering all functions are need calling
 */
async function loadRecipes() {
    // Set area loading
    let displayArea = document.getElementById(`${currentRecipesSelected}-recipes-container`);
    let cardArea = document.getElementById(`${currentRecipesSelected}-recipes-area`);
    let loadingContainer = document.getElementById('loading-container');
    displayArea.style.display = "none";
    loadingContainer.style.display = "block";

    let recipesResult = await getRecipes();
    let authorsResult = await getAuthors();
    let userInfoRequest = await checkUser();

    if(userInfoRequest['status'] == "success") {
        // Save user info
        userInfo = userInfoRequest['data'];
        // Update user panel
        updateUserPanel(userInfo['fname']);
    }

    // To avoid querying the database on each recipe view change, check if we already have this data saved
    if(favorites == undefined) {
        await getFavorites();
    }

    // Confirm loading success
    if(!recipesResult) {
        document.getElementById('loading-container').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i><p>Error</p>';
        return;
    } else {
        // Clear card areas
        document.getElementById('all-recipes-area').innerHTML = "";
        document.getElementById('your-recipes-area').innerHTML = "";

        // Show area
        loadingContainer.style.display = "none";
        displayArea.style.display = "block";
    }

    // Build recipe cards
    // let author = currentRecipesSelected == "your" ? userInfo['user_id'] : null;

    // If we have no recipes, display message
    if(recipes.length == 0) {
        cardArea.innerHTML = '<p>No recipes to show :(</p>';
    } else {
        for(let i = 0; i < recipes.length; i++) {
            let recipe = recipes[i];
            let isOwner = (userInfo != undefined && userInfo['user_id'] == recipe['author'])
            let card = buildRecipeCard(recipe, (favorites.includes(recipe['rec_id'])), isOwner);
            cardArea.appendChild(card);
        }
    }

    showPageination();
    toggleAuthenticatedItems();
}

async function getRecipes() {
    // Get the page number and how many to display per page
    // Default to page 1 and 10 per page
    let page = url.searchParams.get('page') == null ? 1 : url.searchParams.get('page');
    let limit = url.searchParams.get('perPage') == null ? 10 : url.searchParams.get('perPage');
    let author = currentRecipesSelected == "your" ? userInfo : null;

    let query = `https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/recipes?page=${page}&limit=${limit}`;
    if(author != null) {
        filteredAuthors.push(author);
    }
    if(filteredAuthors.length > 0) {
        query = query + "&authors=" + JSON.stringify(filteredAuthors);
    }
    if(filteredCategories.length > 0) {
        query += `&categories=${JSON.stringify(filteredCategories)}`;
    }

    let responsePromise;
    try {
        responsePromise = await fetch(query);
    } catch (e) {
        displayMessage("error", "Error contacting server RECIPES");
        return false;
    }

    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "success") {
        totalRecipes = responseJson['numRecipes']
        recipes = responseJson['data'];
    } else {
        displayMessage("error", "Error retrieving recipes");
        return false;
    }

    return true;
}

async function getAuthors() {
    // Iterate over each recipe and get the authors
    let authorIds = [], recipeWithAuthorIndex = {};
    for(let i=0; i < recipes.length; i++) {
        let currentAuthor = recipes[i]['author'];
        // If no author, just continue
        if(currentAuthor == null) {
            continue;
        }
        // If we haven't seen this author before, save their id
        else if(!authorIds.includes(currentAuthor)) {
            // Push id to array to be sent to server
            authorIds.push(currentAuthor);
            recipeWithAuthorIndex[currentAuthor] = [];
            recipeWithAuthorIndex[currentAuthor].push(i);
        } else {
            recipeWithAuthorIndex[currentAuthor].push(i);
        }
    }

    let response;
    try {
        response = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/author_names?ids=${JSON.stringify(authorIds)}`);
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return false;
    }

    let data = JSON.parse(await response.text());
    authors = [];
    if(data['status'] != "success") {
        displayMessage("error", "Error retrieving recipe authors");
    } else {
        authors = data['data'];
    }

    // Put authors in filter modal
    let authorsTable = document.getElementById('author-filter-table');
    authorsTable.innerHTML = `<tr><th>Author</th><th></th></tr>`;
    for(let i=0; i < authors.length; i++) {
        let tr = document.createElement('tr');
        let authorLabel = `<td>${authors[i]['fname']} ${authors[i]['lname']}</td>`;
        let authorCheckbox = `<td><input type="checkbox" id=author-${i} name=author-${i} /></td>`;
        tr.innerHTML = authorLabel + authorCheckbox;
        authorsTable.appendChild(tr);
    }

    // Save author names to recipes
    for(let i=0; i < authors.length; i++) {
        // Find recipes that this author wrote
        let authorRecipes = recipeWithAuthorIndex[authors[i]['user_id']];
        for(let j=0; j < authorRecipes.length; j++) {
            // Save author name to recipe
            recipes[authorRecipes[j]]['author_fname'] = authors[i]['fname'];
            recipes[authorRecipes[j]]['author_lname'] = authors[i]['lname'];
        }
    }

    return true;
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

async function getFavorites() {
    // Check if user is authenticated
    if(userInfo == undefined) {
        favorites = [];
        return;
    }

    let responsePromise;
    try {
        responsePromise = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/favorites`, {credentials: 'include'});
    } catch (e) {
        displayMessage("error", "Cannot get favorites. Error contacting server");
        return;
    }

    const responseJson = JSON.parse(await responsePromise.text());

    // Check status
    if(responseJson['status'] != "success") {
        displayMessage("error", "Error retrieving favorites");
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

function applyFilters() {
    filterArea = document.getElementById('filter-display-area');
    filterArea.innerHTML = '';

    // Create filter for each filtered author
    for(let i=0; i < filteredAuthors.length; i++) {
        div = document.createElement('div');
        div.classList.add('tag');
        div.classList.add('tag-author');
        div.innerText = `Author: ${filteredAuthors[i]['fname']} ${filteredAuthors[i]['lname']}`;
        filterArea.appendChild(div);
    }
    // Create filter for each filtered category
    for(let i=0; i < filteredCategories.length; i++) {
        div = document.createElement('div');
        div.classList.add('tag');
        div.classList.add('tag-category');
        div.innerText = 'Category: ' + filteredCategories[i]['name'];
        filterArea.appendChild(div);
    }

    loadRecipes();
}

function clearAllFilters() {
    filteredAuthors = [];
    filteredCategories = [];
    applyFilters();
}

async function search() {
    searchTerm = document.getElementById('search-input').value;

    // Used for reset
    if(searchTerm.split(" ").join("").length == 0) {
        loadRecipes();
        return;
    }

    let responsePromise
    try {
        responsePromise = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/search?search=${searchTerm}`);
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return;
    }
    
    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "failure") {
        displayMessage("error", "Error retrieving search results");
        return;
    }

    let searchResults = responseJson['data'];
    const cardArea = document.getElementById('all-recipes-container');
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
        createFavoritesList();
    } else {
        displayMessage("error", result['message']);
    }

    updateFavoriteButton(id);
}

async function setFavoriteLoading(id) {
    const favoriteButton = document.getElementById(`fav-button-${id}`);

    // Check if this favorite button is on the page
    if(favoriteButton == undefined) {
        // This could happen if a user clicks the delete button in the favorites list
        // When the favorite item is on another page
        return;
    } else {
        favoriteButton.innerHTML = '<i class="fa-solid fa-spinner fast-spin fa-xl load-primary"></i>';
    }

    // WHAT IS THIS???
    // If the server is _too_ responsive, changing to a loading symbol looks jittery, so let's just ensure it doesn't
    // Sorry user...
    await new Promise(r => setTimeout(r, 150));
}

async function addFavorite(id) {
    // Save favorite to database
    let favoriteResponse
    try {
        favoriteResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/post/favorite_item`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'id': id })
        });
    } catch (e) {
        return { status: "failure", message: "Error contacting server" };
    }

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
    let unfavoriteResponse;
    try {
        unfavoriteResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/post/unfavorite_item`, {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 'id': id })
        });
    } catch (e) {
        return { status: "failure", message: "Error contacting server" };
    }

    let unfavoriteJson = JSON.parse(await unfavoriteResponse.text());

    // Check for errors
    if(unfavoriteJson['status'] == 'failure') {
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
    i.classList.add('footer-button-icon');
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
    let tokensPromise;
    try {
        tokensPromise = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/auth/tokens`, {credentials: 'include'});
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return;
    }
    
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
    try {
        await fetch("https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/auth/logout", {credentials: 'include'});
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return;
    }

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
    let authButton = document.createElement('a');
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
    // Remove selected class from current element
    document.getElementById(`${currentRecipesSelected}-recipes-button`).classList.remove('recipe-button-selected');
    document.getElementById(`${currentRecipesSelected}-recipes-container`).style.display = "none";

    // Add classes to new element
    document.getElementById(`${area}-recipes-button`).classList.add('recipe-button-selected');

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

    let responsePromise;
    try {
        responsePromise = await fetch('https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/get/random');
    } catch (e) {
        displayMessage("error", "Error contacting server");
        return;
    }
    let responseJson = JSON.parse(await responsePromise.text());

    if(responseJson['status'] == "failure") {
        displayMessage("error", "Error retrieving random recipe");
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

async function deleteRecipe(id) {
    // Set trash to loading symbol
    document.getElementById(`${id}-delete-button-container`).innerHTML = '<i class="fa-solid fa-spinner fast-spin fa-lg load-primary"></i>';

    // Send delete request to server
    let serverResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app/api/post/delete`, {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipe: id
    })
  });

  let serverData = JSON.parse(await serverResponse.text());
  
  if(serverData['status'] == "success") {
    displayMessage("success", "Recipe successfully deleted");
    loadRecipes();
  } else {
    displayMessage("error", "Error deleting recipe");
  }
}

function showFiltersModal() {
    // Helper function
    function isInArray(value, field, array) {
        for(let i=0; i < array.length; i++) {
            if(array[i][field] == value) {
                return true;
            }
        }
    
        return false;
    }

    // Make sure checkboxes are up to date
    for(let i=0; i < authors.length; i++) {
        document.getElementById(`author-${i}`).checked = isInArray(authors[i]['id'], 'id', filteredAuthors);
    }
    for(let i=0; i < categories.length; i++) {
        document.getElementById(`cat-${i}`).checked = isInArray(categories[i]['cat_id'], 'cat_id', filteredCategories);
    }

    // Show modal
    document.getElementById('filter-modal').style.display = "flex";
}

function setCategoryFilters() {
    // Get each author box that is checked
    filteredAuthors = [];
    for(let i=0; i < authors.length; i++) {
        if(document.getElementById(`author-${i}`).checked) {
            filteredAuthors.push(authors[i]);
        }
    }

    // Get each category box that is checked
    filteredCategories = [];
    for(let i=0; i < categories.length; i++) {
        if(document.getElementById(`cat-${i}`).checked) {
            filteredCategories.push(categories[i]);
        }
    }

    // Close modal
    document.getElementById('filter-modal').style.display = "none";

    // Apply filters
    applyFilters();
}
