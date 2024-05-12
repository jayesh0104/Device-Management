function logout(event) {
    event.preventDefault(); // Prevent the default link behavior
    // Perform a POST request to the "/logout" URL
    console.log("done");
    fetch('/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // You can include any necessary data in the request body if required by your server
      body: JSON.stringify({ /* any data you need to send */ })
    })
    .then(response => {
      // Handle the response as needed
      if (response.ok) {
        // Redirect to another page after logout (if needed)
        window.location.href = '/'; // Redirect to the homepage, for example
      } else {
        console.error('Logout failed:', response.statusText);
        // Handle logout failure
      }
    })
    .catch(error => {
      console.error('Logout error:', error);
      // Handle logout error
    });
  }
  