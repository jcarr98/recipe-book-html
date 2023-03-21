function buildRecipeCard(recipe) {
  /* HTML version:
    <div class="grid-item">
      <div class="recipe-card">
        <div class="recipe-card-header">
          Recipe 1
        </div>
        <div class="recipe-card-body">
          Recipe description
        </div>
        <div class="recipe-card-footer">
          <button class="standard-button">Check it out</button>
          <button id="fav-button-1" class="plain-button" onclick="favoriteItem(1)"><i class="fav-button-icon fa-regular fa-heart"></i></button>
        </div>
      </div>
    </div>
  */
  // Create grid-item
  const gridContainer = document.createElement('div');
  gridContainer.classList.add('grid-item');

  // Create recipe card container
  const recipeCard = document.createElement('div');
  recipeCard.classList.add('recipe-card');


  // Create header
  const cardHeader = document.createElement('div');
  cardHeader.classList.add('recipe-card-header');
  cardHeader.innerText = recipe['recipe_name'];


  // Create body
  const cardBody = document.createElement('div');
  cardBody.classList.add('recipe-card-body');

  let author_fname = recipe['author_fname'] != null ? recipe['author_fname'] : 'Anonymous';
  let author_lname = recipe['author_lname'] != null ? recipe['author_lname'] : '';
  const authorBlob = `<p><u><strong>${author_fname} ${author_lname}</strong> wrote this delicious recipe</u></p>`;
  const description = `<p>${recipe['details']}</p>`;

  cardBody.innerHTML = authorBlob + description;

  // Create footer
  const cardFooter = document.createElement('div');
  cardFooter.classList.add('recipe-card-footer');

  const goButton = document.createElement('button');
  goButton.classList.add('standard-button');
  goButton.onclick = () => {window.location.replace(`https://localhost:5500/recipe?id=${recipe['rec_id']}`)};
  goButton.innerText = 'Check it out';

  const favButton = document.createElement('button');
  favButton.id = `fav-button-${recipe['rec_id']}`;
  favButton.classList.add('plain-button');
  favButton.classList.add('authenticated-only');
  favButton.onclick = () => { toggleItemFavoritism(recipe['rec_id']) };
  favButton.innerHTML = '<i class="fav-button-icon fa-regular fa-heart"></i>';

  cardFooter.appendChild(goButton);
  cardFooter.appendChild(favButton);

  
  // Put it all together
  recipeCard.appendChild(cardHeader);
  recipeCard.appendChild(cardBody);
  recipeCard.appendChild(cardFooter);
  gridContainer.appendChild(recipeCard);

  return gridContainer;
}

function createFavoriteLI(id, recipeName) {
  const li = document.createElement('li');

  const liAnchor = document.createElement('a');
  liAnchor.innerText = recipeName;
  liAnchor.href = `https://localhost:5500/recipe?id=${id}`;
  liAnchor.classList.add('favorite-text');

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>'
  deleteButton.classList.add('plain-button');
  deleteButton.style.fontSize = '18px';
  deleteButton.onclick = () => { toggleItemFavoritism(id) };

  li.appendChild(liAnchor);
  li.appendChild(deleteButton);

  return li;
}

function createRandomRecipeLink(id, recipeName) {
  const container = document.createElement('div');
  container.classList.add('random-recipe-item')
  
  const anchor = document.createElement('a');
  anchor.innerHTML = recipeName;
  anchor.style.color = 'var(--font)';
  anchor.href = `https://localhost:5500/recipe?id=${id}`;

  container.appendChild(anchor);

  return container;
}