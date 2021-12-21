function signUp() {
  // Request for the signup
  const XHR = new XMLHttpRequest();
  // Form data to send
  let FD = new FormData(document.getElementById('signUpForm'));

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Created, then displaying status in the message
    if (event.target.status !== 201) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      // Redirecting to login page
      window.location.href = '/';
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('POST', `${apiPath}/signup`);
  XHR.send(FD);
}
