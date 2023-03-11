let currentArea = 'profile';

function switchSidebar(area) {
    // Get required colors
    // Get currently selected area
    let currentButton = document.getElementById(currentArea + '-button');
    let currentBody = document.getElementById(currentArea + '-body');
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
    currentArea = area;
}

function addFilter() {
    filterArea = document.getElementById('filter-display-area');
    i = filterArea.childElementCount;

    // Create small filter
    p = document.createElement('p');
    p.innerText = 'Filter ' + i;
    filterArea.appendChild(p);
}

function search() {
    searchTerm = document.getElementById('search-input').value;
    alert("Searching for " + searchTerm);
}