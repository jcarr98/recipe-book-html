let recipeId;
let redirect;

async function load() {
  // Load categories for autocomplete
  loadCategories();

  // Load ingredients for autocomplete
  loadIngredients();

  // Get recipe info
  let url = new URLSearchParams(window.location.search);
  let recipe = url.get("recipe");

  if(recipe == undefined) {
    displayMessage("error", "No recipe provided");
    return;
  } else {
    recipeId = recipe;
  }

  // Get redirect link (if provided)
  redirect = url.get("redirect");
  // Update back button
  if(redirect != undefined) {
    document.getElementById('confirm-back').innerText = "Back to recipe";
  }

  // Load recipe info
  loadRecipeInfo(recipe);
  loadRecipeIngredients(recipe);
  loadRecipeDirections(recipe);
}

async function loadRecipeInfo(id) {
  let recipeResponse;
  try {
    recipeResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app:8080/api/get/recipe_info?recipeId=${id}`);
  } catch (e) {
    displayMessage("error", "Error contacting server");
    document.getElementById('intro-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }
  let recipeData = JSON.parse(await recipeResponse.text());

  // If we got the recipe, fill in fields
  if(recipeData['status'] == "success") {
    let recipe = recipeData['recipe'];

    document.getElementById('recipe-title').value = recipe['recipe_name'];
    document.getElementById('recipe-description').value = recipe['details'];
    document.getElementById('category-input').value = recipe['category'];
  } else {
    displayMessage("error", "Error loading recipe info");
    document.getElementById('intro-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }

  // Show table
  document.getElementById('intro-loading').style.display = "none";
  document.getElementById('intro-loaded').style.display = "block";
}

async function loadRecipeIngredients(id) {
  let ingredientsResponse;
  try {
    ingredientsResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app:8080/api/get/recipe_ingredients?recipeId=${id}`);
  } catch (e) {
    displayMessage("error", "Error contacting server");
    document.getElementById('ingredients-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }

  let ingredientsResponseData = JSON.parse(await ingredientsResponse.text());

  if(ingredientsResponseData['status'] == "success") {
    let recipeIngredients = ingredientsResponseData['ingredients'];
    for(let i=0; i < recipeIngredients.length; i++) {
      document.getElementById(`ingredient-${totalIngredients}-name`).value = recipeIngredients[i]['ingredientName'];
      document.getElementById(`ingredient-${totalIngredients}-amount`).value = recipeIngredients[i]['amount'];
      document.getElementById(`ingredient-${totalIngredients}-prep`).value = recipeIngredients[i]['prep'];
      document.getElementById(`ingredient-${totalIngredients}-optional`).checked = recipeIngredients[i]['optional'];

      // We don't want to add an extra row at the end
      if(i != recipeIngredients.length-1) addIngredientRow();
    }
  } else {
    displayMessage("error", "Error retrieving recipe ingredients");
    document.getElementById('ingredients-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }

  // Show table
  document.getElementById('ingredients-loading').style.display = "none";
  document.getElementById('ingredients-loaded').style.display = "block";
}

async function loadRecipeDirections(id) {
  let directionsResponse;
  try {
    directionsResponse = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app:8080/api/get/recipe_directions?recipeId=${id}`);
  } catch (e) {
    displayMessage("error", "Error contacting server");
    document.getElementById('directions-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }

  let directionsData = JSON.parse(await directionsResponse.text());

  if(directionsData['status'] == "success") {
    let recipeDirections = directionsData['directions'];

    for(let i=0; i < recipeDirections.length; i++) {
      document.getElementById(`step-${totalSteps}`).value = recipeDirections[i]['step'];
      // We don't want to add an extra row at the end
      if(i != recipeDirections.length-1) addDirectionRow();
    }
  } else {
    displayMessage("error", "Error retrieving recipe directions");
    document.getElementById('directions-loading').innerHTML = '<i class="error-icon fa-solid fa-triangle-exclamation"></i>';
    return;
  }

  // Show table
  document.getElementById('directions-loading').style.display = "none";
  document.getElementById('directions-loaded').style.display = "block";
}

async function submitRecipe() {
  // Change submit button to loading symbol
  let submitButton = document.getElementById('submit-button');
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fast-spin fa-xl load-secondary"></i>';
  submitButton.disabled = true;

  // Collect values
  let title = document.getElementById('recipe-title').value;
  let description = document.getElementById('recipe-description').value;
  let category = document.getElementById('category-input').value;

  // Confirm we have necessary values
  if(title.split(" ").join("").length == 0) {
    displayMessage("error", "You must include a recipe name");
    document.getElementById('recipe-title').value = "";
    submitButton.innerHTML = "Create Recipe";
    submitButton.disabled = false;
    return;
  }
  if(category.split(" ").join("").length == 0) {
    displayMessage("error", "You must include a category");
    document.getElementById('category-input').value = "";
    submitButton.innerHTML = "Create Recipe";
    submitButton.disabled = false;
    return;
  }
  
  let ingredients = [];
  for(let i=0; i < totalIngredients; i++) {
    let name = document.getElementById(`ingredient-${i+1}-name`).value;
    let amount = document.getElementById(`ingredient-${i+1}-amount`).value;
    let prep = document.getElementById(`ingredient-${i+1}-prep`).value;
    let optional = document.getElementById(`ingredient-${i+1}-optional`).checked;
    // Check if there is actually any value
    if(name.split(" ").join("").length == 0) {
      continue;
    } else {
      ingredients.push({
        name: name,
        amount: amount,
        prep: prep,
        optional: optional
      });
    }
  }

  let directions = [];
  for(let j=0; j < totalSteps; j++) {
    let step = document.getElementById(`step-${j+1}`).value;
    if(step.split(" ").join("").length == 0) {
      continue;
    } else {
      directions.push({
        step_num: j+1,
        step: step
      });
    }
  }

  if(ingredients.length == 0 || directions.length == 0) {
    displayMessage("error", "There must be at least one ingredient and one direction")
    submitButton.innerHTML = "Create Recipe";
    submitButton.disabled = false;
    return;
  }

  let response = await fetch(`https://recipe-book-backend-v2-yal6zyrksa-uc.a.run.app:8080/api/post/update`, {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipe: {
        rec_id: recipeId,
        recipe_name: title,
        category: category,
        details: description,
        ingredients: ingredients,
        directions: directions
      }
    })
  });

  let data = JSON.parse(await response.text());
  
  if(data['status'] == "success") {
    let url = new URLSearchParams();
    url.append("success", "Recipe updated succesfully");
    window.location.replace(`/?${url.toString()}`);
  } else {
    if(data['message'] != undefined) {
      displayMessage("error", data['message']);
    } else {
      displayMessage("error", "Error saving recipe");
    }
    submitButton.innerHTML = "Create recipe";
    submitButton.disabled = false;
  }
}

function confirmBack() {
  // Check if we have a redirect link
  if(redirect != undefined) {
    if(redirect == 'recipe') {
      window.location.replace(`https://www.recipe.jeffreycarr.dev/recipe?id=${recipeId}`);
    }
    else if(redirect == 'index') {
      window.location.replace(`https://www.recipe.jeffreycarr.dev/index`);
    }
    // If we have a redirect we can't parse, just go back to index
    else {
      window.location.replace(`https://www.recipe.jeffreycarr.dev/`)
    }
  } else {
    window.location.replace(`https://www.recipe.jeffreycarr.dev/`);
  }
}