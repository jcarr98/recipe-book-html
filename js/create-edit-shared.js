// These are set to 1 because by default there is one already displayed on the page
let totalIngredients = 1;
let totalSteps = 1;
// Globally store categories and ingredients for autocompleation
let categories = [];
let ingredients = [];

async function loadCategories() {
  let data;
  try {
    let response = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/categories`);
    data = await JSON.parse(await response.text());
  } catch (e) {
    displayMessage("error", "Error connecting to server");
    return;
  }

  let categoryData = data['data'];
  if(data['status'] == "success") {
    // Save category items
    for(let i=0; i < categoryData.length; i++) {
      categories.push(categoryData[i]['name']);
    }
  } else {
    displayMessage("error", "Error getting categories");
    return;
  }

  autocomplete(document.getElementById('category-input'), categories);
}

async function loadIngredients() {
  let data;
  try {
    let response = await fetch(`https://recipebookbackend-jeffreycarr98.b4a.run/api/get/ingredients`);
    data = JSON.parse(await response.text());
  } catch (e) {
    displayMessage("error", "Error connecting to server");
    return;
  }

  if(data['status'] == "success") {
    let ingredientData = data['data'];
    // Save ingredient names
    for(let i=0; i < ingredientData.length; i++) {
      ingredients.push(ingredientData[i]['ingredient_name']);
    }
  } else {
    displayMessage("error", "Error getting categories");
    return;
  }

  autocomplete(document.getElementById('ingredient-1-name'), ingredients);
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
  name.innerHTML = `<div class="input-container"><input class="input" id="ingredient-${totalIngredients}-name" name="ingredient-${totalIngredients}-name" type="text"></div>`;

  let amount = document.createElement('td');
  amount.innerHTML = `<input class="input" id="ingredient-${totalIngredients}-amount" name="ingredient-${totalIngredients}-amount" type="text">`;

  let prep = document.createElement('td');
  prep.innerHTML = `<input class="input" id="ingredient-${totalIngredients}-prep" name="ingredient-${totalIngredients}-prep" type="text">`;

  let optional = document.createElement('td');
  optional.innerHTML = `<input class="checkbox" id="ingredient-${totalIngredients}-optional" name="ingredient-${totalIngredients}-optional" type="checkbox">`;

  let deleteButton = document.createElement('td');
  deleteButton.innerHTML = `<button class="plain-button" onclick="deleteIngredientRow(${totalIngredients})"><i class="fa-solid fa-trash-can fa-xl" style="color: red;"></i></button>`;

  ingredientRow.appendChild(name);
  ingredientRow.appendChild(amount);
  ingredientRow.appendChild(prep);
  ingredientRow.appendChild(optional);
  ingredientRow.appendChild(deleteButton);

  ingredientTable.appendChild(ingredientRow);

  autocomplete(document.getElementById(`ingredient-${totalIngredients}-name`), ingredients);
}

function deleteIngredientRow(rowNum) {
  document.getElementById('ingredients-table').deleteRow(rowNum);
  totalIngredients -= 1;
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

  let deleteButton = document.createElement('td');
  deleteButton.innerHTML = `<button class="plain-button" onclick="deleteDirectionRow(${totalSteps-1})"><i class="fa-solid fa-trash-can fa-xl" style="color: red;"></i></button>`;

  newRow.appendChild(step);
  newRow.appendChild(direction);
  newRow.appendChild(deleteButton);

  directionsTable.appendChild(newRow);
}

function deleteDirectionRow(rowNum) {
  document.getElementById('directions-table').deleteRow(rowNum);
  totalSteps -= 1;
}

function autocomplete(inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  let currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function(e) {
      let a, b, i, val = this.value;
      /*close any already open lists of autocompleted values*/
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      /*create a DIV element that will contain the items (values):*/
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      /*append the DIV element as a child of the autocomplete container:*/
      this.parentNode.appendChild(a);
      /*for each item in the array...*/
      for (i = 0; i < arr.length; i++) {
        /*check if the item starts with the same letters as the text field value:*/
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          /*create a DIV element for each matching element:*/
          b = document.createElement("DIV");
          /*make the matching letters bold:*/
          b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
          b.innerHTML += arr[i].substr(val.length);
          /*insert a input field that will hold the current array item's value:*/
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          /*execute a function when someone clicks on the item value (DIV element):*/
              b.addEventListener("click", function(e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
              (or any other open lists of autocompleted values:*/
              closeAllLists();
          });
          a.appendChild(b);
        }
      }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function(e) {
      let x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
        increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) { //up
        /*If the arrow UP key is pressed,
        decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    let x = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
      x[i].parentNode.removeChild(x[i]);
    }
  }
}

  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
      closeAllLists(e.target);
  });
}

function cancelRecipe() {
  let response = confirm("None of your changes will be saved. Continue?");
  if(response) {
    window.location.replace("/");
  }
}

function showBackModal() {
  document.getElementById('back-modal').style.display = "flex";
  document.body.style.overflow = "hidden";
}

function hideBackModal() {
  document.getElementById('back-modal').style.display = "none";
  document.body.style.overflow = "auto";
}