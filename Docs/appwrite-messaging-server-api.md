# Appwrite Messaging API Reference (Server Node.js)

Appwrite Messaging helps you communicate with your users through push notifications, emails, and SMS text messages. This document provides a summary of all messaging endpoints available in the Node.js Server SDK.

## Table of Contents
- [List Messages](#list-messages)
- [Create Email Message](#create-email-message)
- [Update Email Message](#update-email-message)
- [Create Push Notification](#create-push-notification)
- [Update Push Notification](#update-push-notification)
- [Create SMS Message](#create-sms-message)
- [Update SMS Message](#update-sms-message)
- [Get Message](#get-message)
- [Delete Message](#delete-message)
- [List Message Logs](#list-message-logs)
- [List Message Topics](#list-message-topics)
- [Create Topic](#create-topic)
- [Get Topic](#get-topic)
- [Update Topic](#update-topic)
- [Delete Topic](#delete-topic)
- [List Topic Logs](#list-topic-logs)
- [List Subscribers](#list-subscribers)
- [Create Subscriber](#create-subscriber)
- [Get Subscriber](#get-subscriber)
- [Delete Subscriber](#delete-subscriber)

## Installation

First, install the Appwrite Node.js SDK:

```bash
npm install node-appwrite
```

## Initialize the SDK

```javascript
const { Client, Messaging } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]')
    .setKey('[API_KEY]');

const messaging = new Messaging(client);
```

## List Messages

Get a list of all messages.

```javascript
const response = await messaging.listMessages(
    // Optional parameters
    [/* queries */],
    [/* search */]
);
```

## Create Email Message

Create a new email message.

```javascript
const response = await messaging.createEmail(
    '[MESSAGE_ID]',
    '[SUBJECT]',
    '[CONTENT]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    '[CC]',
    '[BCC]',
    '[DRAFT]',
    '[HTML]',
    [/* scheduledAt */],
    '[SCHEDULED_AT]'
);
```

## Update Email Message

Update an email message by its unique ID.

```javascript
const response = await messaging.updateEmail(
    '[MESSAGE_ID]',
    '[SUBJECT]',
    '[CONTENT]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    '[CC]',
    '[BCC]',
    '[DRAFT]',
    '[HTML]',
    [/* scheduledAt */],
    '[SCHEDULED_AT]'
);
```

## Create Push Notification

Create a new push notification.

```javascript
const response = await messaging.createPush(
    '[MESSAGE_ID]',
    '[TITLE]',
    '[BODY]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    [/* data */],
    '[ACTION]',
    '[IMAGE]',
    '[ICON]',
    '[SOUND]',
    '[COLOR]',
    '[TAG]',
    '[BADGE]',
    '[DRAFT]',
    [/* scheduledAt */]
);
```

## Update Push Notification

Update a push notification by its unique ID.

```javascript
const response = await messaging.updatePush(
    '[MESSAGE_ID]',
    '[TITLE]',
    '[BODY]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    [/* data */],
    '[ACTION]',
    '[IMAGE]',
    '[ICON]',
    '[SOUND]',
    '[COLOR]',
    '[TAG]',
    '[BADGE]',
    '[DRAFT]',
    [/* scheduledAt */]
);
```

## Create SMS Message

Create a new SMS message.

```javascript
const response = await messaging.createSms(
    '[MESSAGE_ID]',
    '[CONTENT]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    '[DRAFT]',
    [/* scheduledAt */]
);
```

## Update SMS Message

Update an SMS message by its unique ID.

```javascript
const response = await messaging.updateSms(
    '[MESSAGE_ID]',
    '[CONTENT]',
    [/* topics */],
    '[USERS]',
    [/* targets */],
    '[DRAFT]',
    [/* scheduledAt */]
);
```

## Get Message

Get a message by its unique ID.

```javascript
const response = await messaging.getMessage(
    '[MESSAGE_ID]'
);
```

## Delete Message

Delete a message by its unique ID.

```javascript
const response = await messaging.deleteMessage(
    '[MESSAGE_ID]'
);
```

## List Message Logs

Get the message activity logs listed by its unique ID.

```javascript
const response = await messaging.listMessageLogs(
    '[MESSAGE_ID]',
    [/* queries */]
);
```

## List Message Topics

Get a list of all topics from a message.

```javascript
const response = await messaging.listTargetTopics(
    '[MESSAGE_ID]',
    [/* queries */]
);
```

## Create Topic

Create a new topic.

```javascript
const response = await messaging.createTopic(
    '[TOPIC_ID]',
    '[NAME]',
    [/* subscribe */]
);
```

## Get Topic

Get a topic by its unique ID.

```javascript
const response = await messaging.getTopic(
    '[TOPIC_ID]'
);
```

## Update Topic

Update a topic by its unique ID.

```javascript
const response = await messaging.updateTopic(
    '[TOPIC_ID]',
    '[NAME]',
    [/* subscribe */]
);
```

## Delete Topic

Delete a topic by its unique ID.

```javascript
const response = await messaging.deleteTopic(
    '[TOPIC_ID]'
);
```

## List Topic Logs

List topic logs.

```javascript
const response = await messaging.listTopicLogs(
    '[TOPIC_ID]',
    [/* queries */]
);
```

## List Subscribers

Get a list of all subscribers from a topic.

```javascript
const response = await messaging.listSubscribers(
    '[TOPIC_ID]',
    [/* queries */],
    [/* search */]
);
```

## Create Subscriber

Create a new subscriber.

```javascript
const response = await messaging.createSubscriber(
    '[TOPIC_ID]',
    '[SUBSCRIBER_ID]',
    '[TARGET_ID]'
);
```

## Get Subscriber

Get a subscriber by its unique ID.

```javascript
const response = await messaging.getSubscriber(
    '[TOPIC_ID]',
    '[SUBSCRIBER_ID]'
);
```

## Delete Subscriber

Delete a subscriber by its unique ID.

```javascript
const response = await messaging.deleteSubscriber(
    '[TOPIC_ID]',
    '[SUBSCRIBER_ID]'
);
```

## Important Notes

1. Replace placeholder values (enclosed in `[]`) with actual values when using these endpoints.
2. Some parameters are optional and can be omitted if not needed.
3. The API key used must have appropriate permissions to access these messaging endpoints.
4. All responses are returned as promises and should be properly handled using async/await or .then() syntax.
5. Error handling should be implemented using try/catch blocks.

## Additional Resources

- [Appwrite Documentation](https://appwrite.io/docs)
- [Node.js SDK Reference](https://github.com/appwrite/sdk-for-node)
- [Appwrite Cloud Dashboard](https://cloud.appwrite.io)