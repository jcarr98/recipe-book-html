let allCategories = new Map(), allRecipes = new Map();

async function load() {
  await loadCategories();
  await loadRecipes();
  setupAnimations();
}

/* Categories */
async function loadCategories() {
  let data = await fetch(`https://jeans-recipe-book.herokuapp.com/api/getCategories`)
  let json = JSON.parse(await data.text());

  // Convert json to map
  json.forEach((item) => {
    let category = {
      'name': item.name,
      'color': item.color
    };

    allCategories.set(`${item.id}`, category);
  })

  createFilters(allCategories);
}

function createFilters(categories) {
  // Get categories container
  let container = document.getElementById('categoriesContainer');
  // Erase loading text/symbol
  container.innerHTML = '';

  // Add column headers
  let header1Container = document.createElement('div');
  header1Container.classList.add('category-header');
  let header1 = document.createElement('span');
  header1.innerText = 'Category';
  header1Container.appendChild(header1);

  let header2Container = document.createElement('div');
  header2Container.classList.add('category-header');
  let header2 = document.createElement('span');
  header2.innerText = 'Key';
  header2Container.appendChild(header2);

  container.appendChild(header1Container);
  container.append(header2Container);

  // For each category, create a checkbox
  categories.forEach((item) => {
    let checkbox = createCategoryCheckbox(item);
  });

  // Get card and fix height
  let card = document.getElementById('filtersPanel');
  card.style.height = 'auto';
}

function createCategoryCheckbox(category) {
  // Example category checkbox structure:
  // <div class="box box-nocenter">
  //     <input type="checkbox" id="appetizer" name="appetizer" value="Appetizer" />
  //     <label for="baked"> Appetizer</label>
  // </div>

  let container = document.getElementById('categoriesContainer');

  // Clean provided name. id's may not contain whitespace
  let cleanName = category.name.replace(" ", "").toLowerCase();

  // Create outer div
  let categoryDiv = document.createElement('div');
  categoryDiv.classList.add('box');
  categoryDiv.classList.add('box-nocenter');
  categoryDiv.classList.add('category-item');

  // Create checkbox and set all properties
  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.id = `${cleanName}`;
  checkbox.name = `${cleanName}`;
  checkbox.value = `${category.name}`;  // Use non-clean name for easier use later on

  // Create label
  let label = document.createElement('label');
  label.classList.add('form-control');
  label.for = `${cleanName}`;
  label.innerText = ` ${category.name}`;  // Use non-clean name for visual appeal

  categoryDiv.appendChild(checkbox);
  categoryDiv.appendChild(label);

  // Create color box
  let boxContainer = document.createElement('div');
  boxContainer.classList.add('category-item');
  let box = document.createElement('div');
  box.classList.add('color-box');
  if(category.color !== null) {
    box.style.background = category.color;
  }
  boxContainer.appendChild(box);

  // Add checkbox and label to outer div
  container.appendChild(categoryDiv);
  container.appendChild(boxContainer);
}

/* Recipes */
async function loadRecipes() {
  let data = await fetch(`https://jeans-recipe-book.herokuapp.com/api/get`);
  let json = JSON.parse(await data.text());

  json.forEach((item) => {
    let recipe = {
      'id': item.id,
      'author': item.author,
      'category': item.category,
      'details': item.details,
      'name': item.name
    };

    allRecipes.set(`${item.id}`, recipe);
  });

  createRecipes(allRecipes);
}

function createRecipes(recipes) {
  let container = document.getElementById('recipesContainer');
  container.innerHTML = "";

  recipes.forEach((recipe) => {
    let recipeCard = createRecipeCard(recipe);

    container.appendChild(recipeCard);
  });
}

function createRecipeCard(recipe) {
  // Get category details
  let category = allCategories.get(recipe.category);

  let card = document.createElement('div');
  card.classList.add('card');
  card.classList.add('card-backdrop');

  let titleContainer = document.createElement('div');
  titleContainer.classList.add('card-header');
  let title = document.createElement('span');  // Don't make it a header so there's less padding
  title.style.fontSize = '23px';
  title.style.fontWeight = 'bold';
  title.style.paddingBottom = '5px';
  title.innerText = `${recipe.name}`;
  let cat = document.createElement('span');
  cat.classList.add('tag');
  cat.innerText = `${category.name}`;
  if(category.color !== null) {
    cat.style.backgroundColor = category.color;
  }
  
  let authorContainer = document.createElement('div');
  let author = document.createElement('span');
  author.style.fontSize = '0.8em';
  author.innerText = `Author: ${recipe.author}`;
  authorContainer.appendChild(author);
  authorContainer.style.padding = '10px';
  authorContainer.style.borderBottom = '1px solid var(--main)';
  authorContainer.style.width = '275px';
  titleContainer.appendChild(title);
  titleContainer.appendChild(cat);
  titleContainer.appendChild(authorContainer);

  let bodyContainer = document.createElement('div');
  bodyContainer.classList.add('card-body');
  bodyContainer.classList.add('box-vertical');
  let description = document.createElement('span');
  description.innerText = `${recipe.details}`;
  bodyContainer.appendChild(description);

  let footerContainer = document.createElement('div');
  footerContainer.classList.add('card-footer');
  let btn = document.createElement('button');
  btn.classList.add('btn');
  btn.style.color = '#fff';
  btn.addEventListener('click', function() { alert(`Going to ${recipe.id}`)} );
  btn.innerText = "Go to recipe"
  footerContainer.appendChild(btn);

  // Add everything together
  card.appendChild(titleContainer);
  card.appendChild(bodyContainer);
  card.appendChild(footerContainer);

  card.style.height = '90%';
  card.style.width = '350px';

  return card;
}
function setupAnimations() {
  const dropdown = document.getElementById('apps-dropdown-container');

  // Add listener to window for when apps dropdown isn't clicked
  window.addEventListener('click', (e) => {
    if(e.target.id !== 'apps-dropdown') {
      dropdown.style.display = 'none';
    }
  });
}

function toggleDropdown() {
  let dropdown = document.getElementById('apps-dropdown-container');
  const children = dropdown.children;
  const display = dropdown.style.display;
  
  // Add or remove animation from children;
  for(let i = 0; i < children.length; i++) {
    let a = children[i];
    a.style.animationName = 'fadein';
    a.style.animationDuration = '1s';
    a.style.animationDelay = `${i/6}s`;
    a.style.animationFillMode = 'forwards';
  }

  // Change visibility
  dropdown.style.display = display === 'block' ? 'none' : 'block';
}