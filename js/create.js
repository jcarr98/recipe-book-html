let url = new URLSearchParams();

async function load() {
  // Load categories for autocomplete
  loadCategories();

  // Load ingredients for autocomplete
  loadIngredients();
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

  let response = await fetch(`https://localhost:5001/api/post/create`, {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipe: {
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
    url.append("success", "Recipe saved succesfully");
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