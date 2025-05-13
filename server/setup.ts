/*

INITIAL SETUP STEPS:
- Create initial admin
- Create default schedule
- Create default config
- Setup .env file
- Initialize SSL
- nodemailer config
    - Assign an email address to use for sending all automated emails from the server
        - Optionally, create an alias (Google Group) under a parent account which can be used for login
    - Create a Google Cloud project
    - Set it to internal view
    - Create a client
        - Application type: Web Application
        - Authorized JavaScript Origins: http://localhost:3000 (or preferred port in .env)
        - Authorized redirect URIs: http://localhost:3000/api/v3/oauth
        - Save client id/secret pair
    - Grant https://mail.google.com scopes
    - Generate a default consent screen
    - run the server in development mode with --setup-email to get an OAuthURL in the console
    - Once the OAuth is approved

*/
