# Appwrite Messaging Client Documentation

This document provides an overview of the Appwrite Messaging service endpoints for the Web JavaScript SDK.

## Table of Contents
- [Initialize Messaging](#initialize-messaging)
- [Create Subscriber](#create-subscriber)
- [Delete Subscriber](#delete-subscriber)
- [List Subscriber Topics](#list-subscriber-topics)
- [Subscribe to Topic](#subscribe-to-topic)
- [Unsubscribe from Topic](#unsubscribe-from-topic)

## Initialize Messaging

Before using any messaging endpoints, you need to initialize the Appwrite SDK:

```javascript
import { Client, Messaging } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const messaging = new Messaging(client);
```

## Create Subscriber

Create a new subscriber.

```javascript
const promise = messaging.createSubscriber(
    '[SUBSCRIBER_ID]',
    '[TARGET_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Delete Subscriber

Delete a subscriber by its unique ID.

```javascript
const promise = messaging.deleteSubscriber(
    '[SUBSCRIBER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## List Subscriber Topics

Get a list of all topics that a subscriber is subscribed to.

```javascript
const promise = messaging.listSubscriberTopics(
    '[SUBSCRIBER_ID]',
    [], // queries (optional)
    100 // limit (optional)
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Subscribe to Topic

Subscribe to a topic.

```javascript
const promise = messaging.subscribe(
    '[TOPIC_ID]',
    '[SUBSCRIBER_ID]',
    '[TARGET_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Unsubscribe from Topic

Unsubscribe from a topic.

```javascript
const promise = messaging.unsubscribe(
    '[TOPIC_ID]',
    '[SUBSCRIBER_ID]'
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Important Notes

1. All endpoint methods return a Promise that resolves with the response data or rejects with an error.
2. Replace placeholder values (wrapped in square brackets) with actual values:
   - `[PROJECT_ID]`: Your Appwrite project ID
   - `[SUBSCRIBER_ID]`: Unique subscriber identifier
   - `[TARGET_ID]`: Target identifier (e.g., device token)
   - `[TOPIC_ID]`: Unique topic identifier

## Error Handling

All endpoints include error handling through the Promise catch block or the second callback parameter. Always implement proper error handling in production code:

```javascript
promise.catch(function (error) {
    console.error('Error:', error);
});
```

## Type Support

The Appwrite SDK includes TypeScript definitions out of the box. When using TypeScript, you'll get full type support and autocompletion for all messaging methods and their parameters.

---

For more detailed information, visit the [official Appwrite documentation](https://appwrite.io/docs/references/cloud/client-web/messaging).