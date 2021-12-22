function login() {
  // Request for the signup
  const XHR = new XMLHttpRequest();
  // Form data to send
  const FD = new FormData(document.getElementById('loginForm'));

  const messageLabel = document.getElementById('messageLabel');
  messageLabel.innerHTML = '';

  // Listener when request is completed
  XHR.addEventListener('load', (event) => {
    // If not HTTP Ok, then displaying status in the message
    if (event.target.status !== 200) {
      messageLabel.innerHTML = getErrorMessage(event.target);
    } else {
      // Saving user information
      //sessionStorage.setItem('currentUser', event.target.response);
      // Redirecting the user to the corresponding dashboard
      const user = JSON.parse(event.target.response);
      switch (user.role) {
        case 'admin':
          window.location.href = '/admin/dashboard';
          break;
        case 'student':
          window.location.href = '/student/dashboard';
          break;
        case 'instructor':
          window.location.href = '/instructor/dashboard';
          break;
        default:
          break;
      }
    }
  });

  // Listener when request has failed
  XHR.addEventListener('error', () => {
    messageLabel.innerHTML = 'Network error';
  });

  XHR.open('POST', `${apiPath}/login`);
  //XHR.setRequestHeader("Content-type", 'multipart/form-data');
  XHR.send(FD);
}
