# Server-side Authentication with Next.js using Appwrite

This guide demonstrates how to implement server-side authentication in a Next.js application using Appwrite. It covers project setup, SDK initialization, user authentication flows, and OAuth integration.

## Table of Contents
- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Step 1: Create a Next.js Project](#step-1-create-a-nextjs-project)
- [Step 2: Install Appwrite](#step-2-install-appwrite)
- [Step 3: Initialize the SDK](#step-3-initialize-the-sdk)
- [Step 4: Get the Logged-in User](#step-4-get-the-logged-in-user)
- [Step 5: Create a Sign-up Page](#step-5-create-a-sign-up-page)
- [Step 6: Create an Account Page](#step-6-create-an-account-page)
- [Step 7: OAuth Authentication with SSR](#step-7-oauth-authentication-with-ssr)

## Introduction

Appwrite helps developers implement authentication, databases, file storage, and real-time event responses with secure APIs out of the box. This guide focuses on implementing server-side authentication in Next.js applications using Appwrite.

## Prerequisites

- A recent version of Node.js
- Basic knowledge of Next.js and React
- An Appwrite account and project

## Step 1: Create a Next.js Project

```bash
npx create-next-app@latest
```

The command will give you a prompt with several project types. We'll be starting with a skeleton project.

The prompt will be something similar to this:

```bash
What is your project named? my-app
Would you like to use TypeScript? No
Would you like to use ESLint? No
Would you like to use Tailwind CSS? No
Would you like to use `src/` directory? Yes
Would you like to use App Router? (recommended) Yes
Would you like to customize the default import alias (@/*)? No
What import alias would you like configured? [Enter]
```

After the prompt is finished, you can head over to the newly created project:

```bash
cd my-app
npm install
```

## Step 2: Install Appwrite

Appwrite provides a Node SDK that can be used in your Next.js apps. You can use Appwrite by installing the Node SDK as an NPM package. The Node SDK is intended for server-side use. If you want to use Appwrite in a client-side application, you should use the Web SDK instead.

```bash
npm install node-appwrite
```

## Step 3: Initialize the SDK

Before you can use Appwrite, you need to create the Appwrite Client and set the project ID and endpoint. The client is then used to create services like `Databases` and `Account`, so they all point to the same Appwrite project.

Create a function to build services you need in a file like `src/lib/server/appwrite.js` and export the instances:

```javascript
// src/lib/server/appwrite.js
"use server";
import { Client, Account } from "node-appwrite";
import { cookies } from "next/headers";

export async function createSessionClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT);

  const session = await cookies().get("my-custom-session");
  if (!session || !session.value) {
    throw new Error("No session");
  }

  client.setSession(session.value);

  return {
    get account() {
      return new Account(client);
    },
  };
}

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(process.env.NEXT_APPWRITE_KEY);

  return {
    get account() {
      return new Account(client);
    },
  };
}
```

As part of the function, set the current user's session if they are logged in. This is done by accessing the session cookie from the request and calling the `setSession(session)` with the cookie value.

### Environment Variables

`NEXT_APPWRITE_KEY`, `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT` are environment variables that are exported in your project's `.env` file.

For example, your `.env` might look something similar to this:

```
NEXT_APPWRITE_KEY=<YOUR_API_KEY>
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=<PROJECT_ID>
```

### Appwrite Client Security

Notice that `createAdminClient` and `createSessionClient` returns a new instance of the Appwrite Client. When using Appwrite in server-integrations, it's important to never share a Client instance between two requests. Doing so could create security vulnerabilities.

The `NEXT_PUBLIC_APPWRITE_ENDPOINT` is the endpoint of your Appwrite instance, and the `NEXT_PUBLIC_APPWRITE_PROJECT` is the ID of the project you want to use. You can get the values for these variables from the Appwrite console.

The `NEXT_APPWRITE_KEY` is an Appwrite API key with the necessary permissions to create new sessions.

For this tutorial you'll need an API key with the following scopes:

| Category | Required scopes | Purpose |
|----------|----------------|---------|
| Sessions | sessions.write | Allows API key to create, update, and delete sessions. |

## Step 4: Get the Logged-in User

Build a utility function to get the logged-in user from Appwrite. This function will be used in our components and routes to check if a user is logged in, and access the user's details.

Edit the `src/lib/server/appwrite.js` file to create a new function called `getLoggedInUser`:

```javascript
// ... your initialization functions

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch (error) {
    return null;
  }
}
```

Now, use the `getLoggedInUser` function in the home page to redirect based on the user's login status. Create a new file in the app directory called `page.jsx`:

```javascript
// src/app/page.jsx

import { getLoggedInUser } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getLoggedInUser();

  if (!user) redirect("/signup");

  redirect("/account");
}
```

The user will be redirected to the sign-up page if they are not logged in, or to the account page if they are logged in.

## Step 5: Create a Sign-up Page

We can now implement our sign-up page. Create a `page.jsx` file in the `src/app/signup` directory:

```jsx
// src/app/signup/page.jsx

import { getLoggedInUser } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";

export default async function SignUpPage() {
  const user = await getLoggedInUser();
  if (user) redirect("/account");

  return (
    <>
      <form action={signUpWithEmail}>
        <input
          id="email"
          name="email"
          placeholder="Email"
          type="email"
        />
        <input
          id="password"
          name="password"
          placeholder="Password"
          minLength={8}
          type="password"
        />
        <input
          id="name"
          name="name"
          placeholder="Name"
          type="text"
        />
        <button type="submit">Sign up</button>
      </form>
    </>
  );
}
```

This is an HTML form with email, password, and name inputs. When the form is submitted, we want to send the email and password to Appwrite to authenticate the user. To use Next.js form actions we create the `signUpWithEmail` function in the same file:

```jsx
// src/app/signup/page.jsx

// previous imports ...

import { ID } from "node-appwrite";
import { createAdminClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function signUpWithEmail(formData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");
  const name = formData.get("name");

  const { account } = await createAdminClient();

  await account.create(ID.unique(), email, password, name);
  const session = await account.createEmailPasswordSession(email, password);

  cookies().set("my-custom-session", session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  redirect("/account");
}

// the SignUpPage component ...
```

The `signUpWithEmail` function is an async function that takes the form data as an argument. It uses the `createAdminClient` function to create an admin Appwrite client and then calls the `createEmailPasswordSession` method on the account object. This method takes the email and password as arguments and returns a session object. We then set the session secret in a cookie and redirect the user to the account page.

## Step 6: Create an Account Page

Now the end-user is able to sign up, we can create the account page. This page will display basic information about the user, and allow the user to log out. Create a new file in the `src/app/account` directory called `page.jsx` and add the following code:

```jsx
// src/app/account/page.jsx

import {
  createSessionClient,
  getLoggedInUser,
} from "@/lib/server/appwrite";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

async function signOut() {
  "use server";

  const { account } = await createSessionClient();

  cookies().delete("my-custom-session");
  await account.deleteSession("current");

  redirect("/signup");
}

export default async function HomePage() {
  const user = await getLoggedInUser();
  if (!user) redirect("/signup");

  return (
    <>
      <ul>
        <li>
          <strong>Email:</strong> {user.email}
        </li>
        <li>
          <strong>Name:</strong> {user.name}
        </li>
        <li>
          <strong>ID: </strong> {user.$id}
        </li>
      </ul>

      <form action={signOut}>
        <button type="submit">Sign out</button>
      </form>
    </>
  );
}
```

This code is similar to the signup page, but it uses the `getLoggedInUser` function to get the user's information. If the user is not logged in, the page will redirect to the sign-in page. Again, we use Next.js form actions to execute Appwrite code on the server. This time, the `signOut` function deletes the session cookie and redirects the user to the sign-in page.

## Step 7: OAuth Authentication with SSR

### Enable OAuth Provider

To enable the GitHub OAuth provider, navigate to your Appwrite Console > Auth > Settings > OAuth2 Providers > GitHub

To support the OAuth flow, we first redirect the user to the OAuth provider, and then handle the callback from the OAuth provider.

### OAuth Server Action

Add a new server action. Navigate to `src/lib/server` and create a new file `oauth.js`:

```javascript
// src/lib/server/oauth.js
"use server";

import { createAdminClient } from "@/lib/server/appwrite";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { OAuthProvider } from "node-appwrite";

export async function signUpWithGithub() {
  const { account } = await createAdminClient();

  const origin = headers().get("origin");

  const redirectUrl = await account.createOAuth2Token(
    OAuthProvider.Github,
    `${origin}/oauth`,
    `${origin}/signup`,
  );

  return redirect(redirectUrl);
};
```

The `createOAuth2Token` method redirects the user to the OAuth provider, and then the OAuth provider redirects the user back to the `/oauth` route with the `userId` and `secret` URL query parameters.

### OAuth Form

To redirect, add a button to our sign-up page that redirects the user to the OAuth provider:

```jsx
// src/app/signup/page.jsx

// ... existing imports
import { signUpWithGithub } from "@/lib/server/oauth";

export default async function SignUpPage() {
  const user = await getLoggedInUser();
  if (user) redirect("/account");

  return (
    <>
      {/* ... existing form */}
      <form action={signUpWithGithub}>
        <button type="submit">Sign up with GitHub</button>
      </form>
    </>
  );
}
```

### OAuth Callback

Handle the callback and create a session for the user. Create a new Next.js server route at `src/app/oauth/route.js`:

```javascript
// src/app/oauth/route.js

import { createAdminClient } from "@/lib/server/appwrite";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request) {
  const userId = request.nextUrl.searchParams.get("userId");
  const secret = request.nextUrl.searchParams.get("secret");

  const { account } = await createAdminClient();
  const session = await account.createSession(userId, secret);

  cookies().set("my-custom-session", session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  return NextResponse.redirect(`${request.nextUrl.origin}/account`);
}
```
