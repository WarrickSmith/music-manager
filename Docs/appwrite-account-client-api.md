# Appwrite Account API Reference

This document provides a summary of all Account API endpoints available in the Appwrite Client Web SDK, including JavaScript code examples for each endpoint.

## Table of Contents
- [Get Account](#get-account)
- [Create Account](#create-account)
- [Create Anonymous Session](#create-anonymous-session)
- [Create Email Session](#create-email-session)
- [Create Magic URL Session](#create-magic-url-session)
- [Create OAuth2 Session](#create-oauth2-session)
- [Create Phone Session](#create-phone-session)
- [Update Phone Session](#update-phone-session)
- [Create JWT](#create-jwt)
- [Get Session](#get-session)
- [Update Session](#update-session)
- [Delete Session](#delete-session)
- [Update Name](#update-name)
- [Update Password](#update-password)
- [Update Phone](#update-phone)
- [Update Email](#update-email)
- [Get Account Preferences](#get-account-preferences)
- [Update Account Preferences](#update-account-preferences)
- [Create Recovery](#create-recovery)
- [Update Recovery](#update-recovery)
- [List Sessions](#list-sessions)
- [Delete Sessions](#delete-sessions)
- [Create Verification](#create-verification)
- [Update Verification](#update-verification)

## Get Account

Get the currently logged in account.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.get();
```

## Create Account

Create a new account.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.create(
    '[USER_ID]',
    'email@example.com',
    'password',
    'John Doe'
);
```

## Create Anonymous Session

Create an anonymous session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createAnonymousSession();
```

## Create Email Session

Create an email session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createEmailSession(
    'email@example.com',
    'password'
);
```

## Create Magic URL Session

Create a magic URL session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createMagicURLSession(
    '[USER_ID]',
    'email@example.com'
);
```

## Create OAuth2 Session

Create an OAuth2 session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

account.createOAuth2Session('provider');
```

## Create Phone Session

Create a phone session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createPhoneSession(
    '[USER_ID]',
    '+12065550100'
);
```

## Update Phone Session

Update phone session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updatePhoneSession(
    '[USER_ID]',
    'secret'
);
```

## Create JWT

Create a JSON Web Token.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createJWT();
```

## Get Session

Get session by ID.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.getSession('current');
```

## Update Session

Update current session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updateSession('[SESSION_ID]');
```

## Delete Session

Delete a session.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.deleteSession('[SESSION_ID]');
```

## Update Name

Update currently logged in account name.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updateName('John Doe');
```

## Update Password

Update currently logged in account password.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updatePassword('password');
```

## Update Phone

Update currently logged in account phone number.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updatePhone('+12065550100', 'password');
```

## Update Email

Update currently logged in account email address.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updateEmail('email@example.com', 'password');
```

## Get Account Preferences

Get currently logged in account preferences.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.getPrefs();
```

## Update Account Preferences

Update currently logged in account preferences.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updatePrefs({});
```

## Create Recovery

Create a password recovery.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createRecovery(
    'email@example.com',
    'https://example.com'
);
```

## Update Recovery

Complete password recovery.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updateRecovery(
    '[USER_ID]',
    '[SECRET]',
    'password',
    'password'
);
```

## List Sessions

List all sessions from the current user.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.listSessions();
```

## Delete Sessions

Delete all sessions from the current user.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.deleteSessions();
```

## Create Verification

Create email verification.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.createVerification('https://example.com');
```

## Update Verification

Complete email verification.

```javascript
import { Client, Account } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const account = new Account(client);

const response = await account.updateVerification(
    '[USER_ID]',
    '[SECRET]'
);
```

---

Note: Replace placeholder values (those in square brackets) with actual values:
- `[PROJECT_ID]` - Your Appwrite project ID
- `[USER_ID]` - The user's unique ID
- `[SESSION_ID]` - The session's unique ID
- `[SECRET]` - The secret token received for verification/recovery

For more detailed information, visit the [official Appwrite documentation](https://appwrite.io/docs/references/cloud/client-web/account).