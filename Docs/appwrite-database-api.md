# Appwrite Server Node.js API Documentation - Databases

This document provides a comprehensive overview of the Appwrite Databases API endpoints for Node.js Server SDK.

## Table of Contents
- [Initial Setup](#initial-setup)
- [Database Operations](#database-operations)
- [Collection Operations](#collection-operations)
- [Document Operations](#document-operations)
- [Index Operations](#index-operations)
- [Attribute Operations](#attribute-operations)

## Initial Setup

Before using the database API, you need to initialize the Appwrite SDK:

```javascript
const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('5df5acd0d48c2') // Your project ID
    .setKey('919c2d18fb5d4...a2ae413da83346ad2'); // Your secret API key

const databases = new Databases(client);
```

## Database Operations

### List Databases
Retrieve a list of all databases.

```javascript
const promise = databases.list();

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create Database
Create a new database.

```javascript
const databaseId = '[DATABASE_ID]';
const name = '[NAME]';

const promise = databases.create(databaseId, name);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get Database
Get a database by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';

const promise = databases.get(databaseId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Database
Update a database by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const name = '[NAME]';

const promise = databases.update(databaseId, name);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Database
Delete a database by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';

const promise = databases.delete(databaseId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Collection Operations

### List Collections
Get a list of all collections inside a database.

```javascript
const databaseId = '[DATABASE_ID]';

const promise = databases.listCollections(databaseId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create Collection
Create a new collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const name = '[NAME]';

const promise = databases.createCollection(
    databaseId,
    collectionId,
    name
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get Collection
Get a collection by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';

const promise = databases.getCollection(databaseId, collectionId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Collection
Update a collection by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const name = '[NAME]';

const promise = databases.updateCollection(
    databaseId,
    collectionId,
    name
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Collection
Delete a collection by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';

const promise = databases.deleteCollection(databaseId, collectionId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Document Operations

### List Documents
List all documents from a collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';

const promise = databases.listDocuments(databaseId, collectionId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create Document
Create a new document in a collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const documentId = '[DOCUMENT_ID]';
const data = {}; // Your document data as an object

const promise = databases.createDocument(
    databaseId,
    collectionId,
    documentId,
    data
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get Document
Get a document by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const documentId = '[DOCUMENT_ID]';

const promise = databases.getDocument(
    databaseId,
    collectionId,
    documentId
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Update Document
Update a document by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const documentId = '[DOCUMENT_ID]';
const data = {}; // Your updated document data

const promise = databases.updateDocument(
    databaseId,
    collectionId,
    documentId,
    data
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Document
Delete a document by its unique ID.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const documentId = '[DOCUMENT_ID]';

const promise = databases.deleteDocument(
    databaseId,
    collectionId,
    documentId
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Index Operations

### List Indexes
Get a list of all indexes from a collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';

const promise = databases.listIndexes(databaseId, collectionId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create Index
Create a new index.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';
const type = 'key'; // Available types: key, fulltext, unique
const attributes = ['[ATTRIBUTE]']; // Array of attributes to index

const promise = databases.createIndex(
    databaseId,
    collectionId,
    key,
    type,
    attributes
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get Index
Get an index by its key.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';

const promise = databases.getIndex(
    databaseId,
    collectionId,
    key
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Index
Delete an index by its key.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';

const promise = databases.deleteIndex(
    databaseId,
    collectionId,
    key
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Attribute Operations

### List Attributes
List all attributes in a collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';

const promise = databases.listAttributes(databaseId, collectionId);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Create Attribute
Create a new attribute in a collection.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';
const type = 'string'; // Available types: string, integer, float, boolean, email, url, ip
const required = false;

const promise = databases.createStringAttribute(
    databaseId,
    collectionId,
    key,
    required
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Get Attribute
Get an attribute by its key.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';

const promise = databases.getAttribute(
    databaseId,
    collectionId,
    key
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

### Delete Attribute
Delete an attribute by its key.

```javascript
const databaseId = '[DATABASE_ID]';
const collectionId = '[COLLECTION_ID]';
const key = '[KEY]';

const promise = databases.deleteAttribute(
    databaseId,
    collectionId,
    key
);

promise.then(function (response) {
    console.log(response);
}, function (error) {
    console.log(error);
});
```

## Error Handling

All API calls return promises that can be handled using `.then()` and `.catch()` or async/await syntax. Each error response includes:
- A message describing the error
- A code indicating the error type
- Additional context when available

Example error handling:

```javascript
try {
    const response = await databases.getDocument(databaseId, collectionId, documentId);
    console.log(response);
} catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
}
```

## Notes
- All IDs must be unique within their scope
- Attribute names are case-sensitive
- Some operations may require specific permissions set in your project settings
- Always handle errors appropriately in production environments
- Use proper security measures when dealing with sensitive data