let keepAwake = false;

// Define global variables
let recipeInfo, recipeIngredients, recipeDirections;

async function load() {
  // Get URL parameters
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  
  // Get recipe ID
  let id = urlParams.get('id');

  // Check we have valid ID
  // TODO - Error handling
  if(id == null) {
    console.error("No valid recipe ID provided");
    return;
  }

  // These can all be loaded asynchronously
  loadRecipeInfo(id);
  loadRecipeIngredients(id);
  loadRecipeDirections(id);

  // TODO - Get favorited
  // TODO - Get user info
}

async function loadRecipeInfo(id) {
  // Send fetch request to backend
  let data = await fetch(`https://localhost:5001/api/get/recipe_info?recipeId=${id}`);
  let dataJson = JSON.parse(await data.text());
  console.log(`[${dataJson['status']}] loading recipe info`);

  if(dataJson['status'] == "success") {
    recipeInfo = dataJson['recipe'];
  } else {
    // TODO - Set error message
    console.error("Error retrieving recipe info");
  }

  // Put all info on web page
  displayRecipe();
}

function displayRecipe() {
  // Change title
  window.document.title = `${recipeInfo['recipe_name']} - Jean's Recipe Book`;

  // Put recipe title
  document.getElementById('recipe-title').innerText = recipeInfo['recipe_name'];

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
  let data = await fetch(`https://localhost:5001/api/get/recipe_ingredients?recipeId=${id}`);
  let dataJson = JSON.parse(await data.text());
  console.log(`[${dataJson['status']}] loading recipe ingredients`);

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
  let data = await fetch(`https://localhost:5001/api/get/recipe_directions?recipeId=${id}`);
  let dataJson = JSON.parse(await data.text());
  console.log(`[${dataJson['status']}] loading recipe directions`);

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

function printValue(component) {
  if(component == "info") {
    if(recipeInfo == undefined) {
      console.error("Recipe info not loaded yet!");
    } else {
      console.log(recipeInfo);
    }
  }
  else if(component == "ingredients") {
    if(recipeIngredients == undefined) {
      console.error("Recipe ingredients not loaded yet!");
    } else {
      console.log(recipeIngredients);
    }
  }
  else {
    if(recipeDirections == undefined) {
      console.error("Recipe directions not loaded yet!");
    } else {
      console.log(recipeDirections);
    }
  }
}

function updateKeepAwake() {
  const keepAwakeIcon = document.getElementById('keep-awake-icon');
  if(keepAwake) {
    keepAwakeIcon.classList.add('fa-eye-slash');
    keepAwakeIcon.classList.remove('fa-eye');
  } else {
    keepAwakeIcon.classList.remove('fa-eye-slash');
    keepAwakeIcon.classList.add('fa-eye');
  }

  keepAwake = !keepAwake;
}