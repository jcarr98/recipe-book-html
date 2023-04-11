async function checkUser() {
    // Check if user is authenticated in the backend
    let response, data;
    try {
        response = await fetch(`https://localhost:5001/auth/check_authentication`, {credentials: 'include'});
        data = JSON.parse(await response.text());
    } catch (e) {
        displayMessage("error", "Cannot verify authentication. Error contacting server");
        data = {};
        data['authenciated'] = false;
        return { status: "failure" };
    }
    
    // Default page shows unauthenticated user, so don't change anything
    if(!data['authenticated']) {
        return { status: "failure" };
    } else {
        return { status: "success", data: data['user'] };
    }
}

function displayMessage(status, message) {
  let modalStyle;
  switch(status) {
      case "success":
          modalStyle = "success-modal";
          break;
      case "error":
          modalStyle = "error-modal";
          break;
      default:
          // There should never be a default, so just ignore if there is
          return;
  }
  let modal = document.createElement('div');
  modal.classList.add('message-modal');
  modal.classList.add(modalStyle);

  let modalText = document.createElement('div');
  modalText.innerText = message;

  modal.appendChild(modalText);
  document.getElementById('modal-area').appendChild(modal);
  setTimeout(() => {
      modal.style.animation = "fadeOut 3s";
      modal.addEventListener('animationend', () => {
          modal.style.display = "none";
      });
  }, 5000);
}