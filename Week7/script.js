// Wait for the HTML structure to fully load before running the script
document.addEventListener('DOMContentLoaded', () => {
    
    // Select the registration form using DOM manipulation
    const registerForm = document.getElementById('registerForm');

    // Only run this logic if we are actually on the registration page
    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            
            // Grab the values the user typed into the password fields
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Check if there is an existing error message and remove it (cleanup)
            const existingError = document.getElementById('error-message');
            if (existingError) {
                existingError.remove();
            }

            // Validation Logic: Do the passwords match?
            if (password !== confirmPassword) {
                
                // 1. Stop the form from sending data to the server
                event.preventDefault(); 
                
                // 2. DOM Manipulation: Create a new error message element dynamically
                const errorDiv = document.createElement('div');
                errorDiv.id = 'error-message';
                errorDiv.style.color = '#dc3545'; // Red color
                errorDiv.style.backgroundColor = '#f8d7da';
                errorDiv.style.padding = '10px';
                errorDiv.style.borderRadius = '4px';
                errorDiv.style.marginBottom = '15px';
                errorDiv.style.textAlign = 'center';
                errorDiv.innerText = 'Error: Your passwords do not match!';

                // 3. Inject the error message at the top of the form
                registerForm.prepend(errorDiv);
            }
        });
    }
});