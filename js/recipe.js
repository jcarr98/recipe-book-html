let keepAwake = false;

// Define global variables
let recipeInfo = {}, recipeIngredients = [], recipeDirections = [];
let userInfo;

async function load() {
  // Get URL parameters
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  
  // Get recipe ID
  let id = urlParams.get('id');

  // Check we have valid ID
  // TODO - Error handling
  if(id == null) {
    displayMessage("error", "No recipe ID provided");
    return;
  }

  // Load user info first - this will let us know if the user is authenticated and can favorite items
  let userInfoRequest = await checkUser();
  if(userInfoRequest['status'] == "success") {
    userInfo = userInfoRequest['data'];
  }

  // These can all be loaded asynchronously
  createVideo();
  loadRecipeInfo(id);
  loadRecipeIngredients(id);
  loadRecipeDirections(id);
}

function createVideo() {
  let videoContainer = document.getElementById('video-container');
  // Create the root video element
  let video = document.createElement('video');
  video.id = 'keep-awake-video';
  video.setAttribute('loop', '');
  // Add some styles if needed
  video.setAttribute('style', 'position: fixed;');

  // A helper to add sources to video
  function addSourceToVideo(element, type, dataURI) {
      let source = document.createElement('source');
      source.src = dataURI;
      source.type = 'video/' + type;
      element.appendChild(source);
  }

  // A helper to concat base64
  var base64 = function(mimeType, base64) {
      return 'data:' + mimeType + ';base64,' + base64;
  };

  // Add Fake sourced
  addSourceToVideo(video,'webm', base64('video/webm', 'GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA='));
  addSourceToVideo(video, 'mp4', base64('video/mp4', 'AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAG21kYXQAAAGzABAHAAABthADAowdbb9/AAAC6W1vb3YAAABsbXZoZAAAAAB8JbCAfCWwgAAAA+gAAAAAAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAIVdHJhawAAAFx0a2hkAAAAD3wlsIB8JbCAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAIAAAACAAAAAABsW1kaWEAAAAgbWRoZAAAAAB8JbCAfCWwgAAAA+gAAAAAVcQAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAAAVxtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAEcc3RibAAAALhzdHNkAAAAAAAAAAEAAACobXA0dgAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAIAAgASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAAFJlc2RzAAAAAANEAAEABDwgEQAAAAADDUAAAAAABS0AAAGwAQAAAbWJEwAAAQAAAAEgAMSNiB9FAEQBFGMAAAGyTGF2YzUyLjg3LjQGAQIAAAAYc3R0cwAAAAAAAAABAAAAAQAAAAAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAAAEwAAAAEAAAAUc3RjbwAAAAAAAAABAAAALAAAAGB1ZHRhAAAAWG1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAAK2lsc3QAAAAjqXRvbwAAABtkYXRhAAAAAQAAAABMYXZmNTIuNzguMw=='));

  // Append the video to where ever you need
  videoContainer.appendChild(video);
}

async function loadRecipeInfo(id) {
  console.log("Loading recipe info");
  // If user is authenticated, start checking if this recipe is favorited
  let favoritedPromise;
  if(userInfo != undefined) {
    favoritedPromise = checkIfFavorited(id);
  }

  // Send fetch request to backend
  let recipeResponse = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/recipe_info?recipeId=${id}`);
  let recipeData = JSON.parse(await recipeResponse.text());

  if(recipeData['status'] == "success") {
    recipeInfo = recipeData['recipe'];
    recipeInfo['rec_id'] = id;
  } else {
    // TODO - Set error message
    displayMessage("error", "Error retrieving recipe info");
    console.error("Error retrieving recipe info");
    return;
  }

  // Get author name
  let authorResponse = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/author_names?ids=${JSON.stringify([recipeInfo['author']])}`);
  let authorData = JSON.parse(await authorResponse.text());

  // Update author info
  if(authorData['status'] == "success") {
    if(authorData['data'].length == 0) {
      recipeInfo['author_fname'] = "Anonymous";
      recipeInfo['author_lname'] = "";
    } else {
      recipeInfo['author_fname'] = authorData['data'][0]['fname'];
      recipeInfo['author_lname'] = authorData['data'][0]['lname'];
    }
  } else {
    console.error("Error retrieving author name");
    recipeInfo['author_fname'] = "Unknown";
    recipeInfo['author_lname'] = "";
  }

  // Wait for favorited item to finish
  if(userInfo != undefined) {
    let favorited = await favoritedPromise;
    if(favorited['status'] == "success") {
      recipeInfo['favorited'] = favorited['favorited'];
    } else {
      displayMessage("error", "Error checking favorites");
      recipeInfo['favorited'] = false;
    }
  }

  // Put all info on web page
  displayRecipe();
}

function displayRecipe() {
  // Change title
  window.document.title = `${recipeInfo['recipe_name']} - Jean's Recipe Book`;

  // Put recipe title
  // Add favorite button if user is logged in
  let recipeTitle;
  if(userInfo != undefined) {
    // Add favorite button
    recipeTitle =`${recipeInfo['recipe_name']} <button id="favorite-button" class="plain-button title-button" onclick="favorite()">`;
    if(recipeInfo['favorited']) {
      recipeTitle += '<i class="fav-button-icon fa-regular fa-heart fa-solid"></i></button>';
    } else {
      recipeTitle += '<i class="footer-button-icon fa-regular fa-heart"></i></button>';
    }
    // Add edit button
    if(userInfo['user_id'] == recipeInfo['author']) {
      recipeTitle += `<a id="edit-button" class="plain-button title-button" href="https://www.recipe.jeffreycarr.dev/edit?recipe=${recipeInfo['rec_id']}&redirect=recipe"><i class="fa-solid fa-pencil"></i></a>`;
    }
  } else {
    recipeTitle =`${recipeInfo['recipe_name']}`;
  }

  document.getElementById('recipe-title').innerHTML = recipeTitle;

  // Put author
  let author;
  if(recipeInfo['author_fname'] != null) {
    author = `${recipeInfo['author_fname']} ${recipeInfo['author_lname']}`;
  } else {
    author = "Anonymous";
  }
  document.getElementById('recipe-author').innerHTML = `<b>Author:</b> ${author}`;

  // Put description
  document.getElementById('recipe-description').innerText = recipeInfo['details'];

  // Make area visible
  document.getElementById('recipe-info-loading').style.display = 'none';
  document.getElementById('recipe-info-data').style.display = 'block';
}

async function loadRecipeIngredients(id) {
  let data = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/recipe_ingredients?recipeId=${id}`);
  let dataJson = JSON.parse(await data.text());

  if(dataJson['status'] == "success") {
    recipeIngredients = dataJson['ingredients'];
  } else {
    // TODO - Set error message
    console.error("Error retrieving recipe ingredients");
  }

  displayIngredients();
}

function displayIngredients() {
  // Get list area
  const ingredientsList = document.getElementById('ingredients-table');

  // Iterate over all ingredients and write to list
  for(let i=0; i < recipeIngredients.length; i++) {
    let item = recipeIngredients[i];
    // Create list item
    let tr = document.createElement('tr');

    // Create Amount item
    let amount = document.createElement('td');
    amount.innerText = `${(item['amount'] != null) ? `${item['amount']}` : ""}`;

    // Create Ingredient item
    let ingredient = document.createElement('td');
    ingredient.innerText = item['ingredientName'];

    // Create Prep item
    let prep = document.createElement('td');
    prep.innerText = (item['prep'] != null) ? item['prep'] : "";

    // Add text to item
    tr.appendChild(amount);
    tr.appendChild(ingredient);
    tr.appendChild(prep);

    // Add item to full list
    ingredientsList.appendChild(tr);
  }

  // Hide loading text
  document.getElementById('ingredients-loading').style.display = 'none';
  // Show directions data
  document.getElementById('ingredients-data').style.display = 'block';
}

async function loadRecipeDirections(id) {
  let data = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/recipe_directions?recipeId=${id}`);
  let dataJson = JSON.parse(await data.text());

  if(dataJson['status'] == "success") {
    recipeDirections = dataJson['directions'];
  } else {
    // TODO - Set error message
    console.error("Error retrieving recipe directions");
  }

  displayRecipeDirections();
}

function displayRecipeDirections() {
  // Get directions area
  const directionsArea = document.getElementById('directions-area');

  // Create a step item for each direction
  for(let i=0; i < recipeDirections.length; i++) {
    let direction = recipeDirections[i];

    let directionItem = document.createElement('div');
    directionItem.classList.add('step-item');

    let stepNum = document.createElement('div');
    stepNum.classList.add('step-num');
    stepNum.innerText = `Step ${i+1}.`;

    let step = document.createElement('div');
    step.classList.add('step');
    step.innerText = direction['step'];
    

    directionItem.appendChild(stepNum);
    directionItem.appendChild(step);

    directionsArea.appendChild(directionItem);
  }

  // Hide loading text
  document.getElementById('directions-loading').style.display = 'none';
  // Show directions area
  document.getElementById('directions-data').style.display = 'block';
}

async function checkIfFavorited(id) {
  let data = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/is_favorited?recipeId=${id}`, { credentials: 'include' });

  // Return the result
  return JSON.parse(await data.text());
}

async function favorite() {
  // Set loading symbol for heart
  let favoriteButton = document.getElementById('favorite-button');
  favoriteButton.innerHTML = '<i class="fa-solid fa-spinner fast-spin fa-lg load-primary"></i>';

  // Send request to backend
  let data;
  if(recipeInfo['favorited']) {
    let result = await fetch('https://recipebookbackend-jeffreycarr98.b4a.run/api/post/unfavorite_item', {
      method: 'POST',
      credentials: 'include',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: recipeInfo['rec_id']
      })
    });

    data = JSON.parse(await result.text());
    data['oldIcon'] = '<i class="fav-button-icon fa-regular fa-heart fa-solid"></i>'
    data['newIcon'] = '<i class="fav-button-icon fa-regular fa-heart"></i>';
  } else {
    let result = await fetch('https://recipebookbackend-jeffreycarr98.b4a.run/api/post/favorite_item', {
      method: 'POST',
      credentials: 'include',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: recipeInfo['rec_id']
      })
    });

    data = JSON.parse(await result.text());
    data['oldIcon'] = '<i class="fav-button-icon fa-regular fa-heart"></i>'
    data['newIcon'] = '<i class="fav-button-icon fa-regular fa-heart fa-solid"></i>';
  }

  if(data['status'] == "success") {
    recipeInfo['favorited'] = !recipeInfo['favorited'];
    favoriteButton.innerHTML = data['newIcon'];
  } else {
    displayMessage("error", `Error ${recipeInfo['favorited'] ? "removing favorite" : "favoriting item"}`);
    favoriteButton.innerHTML = data['oldIcon'];
  }
}

function updateKeepAwake() {
  const keepAwakeButton = document.getElementById('keep-awake-button');
  if(keepAwake) {
    displayMessage("success", "No longer keeping screen awake");
    document.getElementById('keep-awake-video').pause();
    keepAwakeButton.innerHTML = '<i id="keep-awake-icon" class="fa-solid fa-eye-slash"></i> Keep screen awake';
  } else {
    displayMessage("success", "Keeping screen awake");
    document.getElementById('keep-awake-video').play();
    keepAwakeButton.innerHTML = '<i id="keep-awake-icon" class="fa-solid fa-eye"></i> Stop keeping screen awake';
  }

  keepAwake = !keepAwake;
}