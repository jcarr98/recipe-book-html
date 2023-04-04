// These are set to 1 because by default there is one already displayed on the page
let totalIngredients = 1;
let totalSteps = 1;

async function loadRecipe() {
  // Check if we have any pre-defined values to load
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  // Check if we are editing a recipe
  // TODO
  if(urlParams.get('recipe') != undefined) {
    console.log("Loading recipe info from database");
  }
}

async function loadRecipeInfo(id) {
  // TODO
}

async function loadRecipeIngredients(id) {
  // TODO
}

async function loadRecipeDirections(id) {
  // TODO
}

function addIngredientRow() {
  // HTML:
  // <tr>
  //   <td><input class="input" id="ingredient-1-name" name="ingredient-1-name" type="text"></td>
  //   <td><input class="input" id="ingredient-1-amount" name="ingredient-1-amount" type="text"></td>
  //   <td><input class="input" id="ingredient-1-prep" name="ingredient-1-prep" type="text"></td>
  // </tr>
  totalIngredients += 1;

  let ingredientTable = document.getElementById('ingredients-table');
  let ingredientRow = document.createElement('tr');
  
  let name = document.createElement('td');
  name.innerHTML = `<input class="input" id="ingredient-${totalIngredients}-name" name="ingredient-${totalIngredients}-name" type="text" data-required="true">`

  let amount = document.createElement('td');
  amount.innerHTML = `<input class="input" id="ingredient-${totalIngredients}-amount" name="ingredient-${totalIngredients}-amount" type="text">`

  let prep = document.createElement('td');
  prep.innerHTML = `<input class="input" id="ingredient-${totalIngredients}-prep" name="ingredient-${totalIngredients}-prep" type="text">`

  ingredientRow.appendChild(name);
  ingredientRow.appendChild(amount);
  ingredientRow.appendChild(prep);

  ingredientTable.appendChild(ingredientRow);
}

function addDirectionRow() {
  /* HTML:
    <tr>
      <td>Step x</td>
      <td><input class="input input-wide input-medium" id="step-x" name="step-x"></td>
    </tr>
  */
  totalSteps += 1;

  let directionsTable = document.getElementById('directions-table');

  let newRow = document.createElement('tr');

  let step = document.createElement('td');
  step.innerText = `Step ${totalSteps}`;

  let direction = document.createElement('td');
  direction.innerHTML = `<textarea class="input input-wide input-medium" id="step-${totalSteps}" name="step-${totalSteps}"></textarea>`;

  newRow.appendChild(step);
  newRow.appendChild(direction);

  directionsTable.appendChild(newRow);
}

function submitRecipe() {
  // TODO
}

function cancelRecipe() {
  // TODO
}