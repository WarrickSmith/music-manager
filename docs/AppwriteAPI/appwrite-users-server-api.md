# Appwrite Users API Reference (Node.js)

This document provides a comprehensive overview of the Appwrite Users API endpoints for Node.js server-side applications. The Users service allows you to manage your project users, including searching, blocking, and viewing user information, current sessions, and activity logs.

## Table of Contents
- [Installation](#installation)
- [Initialization](#initialization)
- [Available Methods](#available-methods)

## Installation

```bash
npm install node-appwrite
```

## Initialization

```javascript
const { Client, Users } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('YOUR_PROJECT_ID')               // Your project ID
    .setKey('YOUR_API_KEY');                    // Your secret API key

const users = new Users(client);
```

## Available Methods

### List Users
Get a list of all users in the project.

```javascript
const promise = users.list();

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create User
Create a new user.

```javascript
const promise = users.create(
    'unique()',           // userId
    'email@example.com',  // email
    '+1234567890',       // phone (optional)
    'password',          // password
    'John Doe'           // name (optional)
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get User
Get a user by their unique ID.

```javascript
const promise = users.get('[USER_ID]');

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete User
Delete a user by their unique ID.

```javascript
const promise = users.delete('[USER_ID]');

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Email
Update the user's email address.

```javascript
const promise = users.updateEmail(
    '[USER_ID]',
    'new.email@example.com'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Phone
Update the user's phone number.

```javascript
const promise = users.updatePhone(
    '[USER_ID]',
    '+1234567890'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Password
Update the user's password.

```javascript
const promise = users.updatePassword(
    '[USER_ID]',
    'newpassword123'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Name
Update the user's name.

```javascript
const promise = users.updateName(
    '[USER_ID]',
    'John Doe'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get User Preferences
Get the user's preferences as a key-value object.

```javascript
const promise = users.getPrefs(
    '[USER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update User Preferences
Update the user's preferences.

```javascript
const promise = users.updatePrefs(
    '[USER_ID]',
    {} // preferences object
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get User Sessions
Get the user's current sessions.

```javascript
const promise = users.listSessions(
    '[USER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete User Sessions
Delete all user's sessions.

```javascript
const promise = users.deleteSessions(
    '[USER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Session
Delete a specific user session.

```javascript
const promise = users.deleteSession(
    '[USER_ID]',
    '[SESSION_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update User Status
Update the user's status. Set whether a user is blocked or active.

```javascript
const promise = users.updateStatus(
    '[USER_ID]',
    'active' // or 'blocked'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get User Logs
Get the user's activity logs.

```javascript
const promise = users.getLogs(
    '[USER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get User Memberships
Get the user's membership roles for all teams.

```javascript
const promise = users.getMemberships(
    '[USER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Error Handling

All methods return a Promise that resolves with the response data or rejects with an error. Always implement proper error handling in your applications:

```javascript
users.list()
    .then(response => {
        // Handle successful response
        console.log(response);
    })
    .catch(error => {
        // Handle error
        console.error('Error:', error);
    });
```

## Notes

- Replace placeholder values (like `[USER_ID]`, `[SESSION_ID]`) with actual values in your code.
- Always ensure you have the proper permissions and API keys set up in your Appwrite project.
- Some methods might require specific permissions or roles to be executed successfully.
- All timestamps are returned in ISO 8601 format.