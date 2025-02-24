# Appwrite Web Client Database API Reference

This document provides a comprehensive overview of the Appwrite Databases service endpoints available in the Web Client SDK. The Databases service allows you to create structured collections of documents, query and filter lists of documents, and manage document access permissions.

## Table of Contents
- [Initialize Database Service](#initialize-database-service)
- [List Documents](#list-documents)
- [Create Document](#create-document)
- [Get Document](#get-document)
- [Update Document](#update-document)
- [Delete Document](#delete-document)

## Initialize Database Service

Before using any database endpoints, you need to initialize the Appwrite client and database service:

```javascript
import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const databases = new Databases(client);
```

## List Documents

Retrieve a list of documents from a collection.

```javascript
const promise = databases.listDocuments(
    '[DATABASE_ID]',
    '[COLLECTION_ID]',
    [
        Query.equal('field', 'value'),
        Query.limit(50)
    ]
);

promise.then(function (response) {
    console.log(response); // Success
}, function (error) {
    console.log(error); // Failure
});
```

## Create Document

Create a new document in a collection.

```javascript
const promise = databases.createDocument(
    '[DATABASE_ID]',
    '[COLLECTION_ID]',
    '[DOCUMENT_ID]', // unique ID
    {} // document data
);

promise.then(function (response) {
    console.log(response); // Success
}, function (error) {
    console.log(error); // Failure
});
```

## Get Document

Retrieve a document by its unique ID.

```javascript
const promise = databases.getDocument(
    '[DATABASE_ID]',
    '[COLLECTION_ID]',
    '[DOCUMENT_ID]'
);

promise.then(function (response) {
    console.log(response); // Success
}, function (error) {
    console.log(error); // Failure
});
```

## Update Document

Update a document by its unique ID.

```javascript
const promise = databases.updateDocument(
    '[DATABASE_ID]',
    '[COLLECTION_ID]',
    '[DOCUMENT_ID]',
    {} // document data
);

promise.then(function (response) {
    console.log(response); // Success
}, function (error) {
    console.log(error); // Failure
});
```

## Delete Document

Delete a document by its unique ID.

```javascript
const promise = databases.deleteDocument(
    '[DATABASE_ID]',
    '[COLLECTION_ID]',
    '[DOCUMENT_ID]'
);

promise.then(function (response) {
    console.log(response); // Success
}, function (error) {
    console.log(error); // Failure
});
```

## Additional Notes

- All methods return a Promise that resolves with the response data or rejects with an error
- The database ID, collection ID, and document ID parameters are required for most operations
- You can use Query helpers to filter, sort, and limit results when listing documents
- Document data should match the collection's schema
- Proper error handling should be implemented for production use

## Error Handling

All endpoints can throw various errors that should be handled appropriately:

```javascript
promise.catch(error => {
    if (error.code === 404) {
        console.log('Document not found');
    } else if (error.code === 401) {
        console.log('Unauthorized');
    } else {
        console.log('Something went wrong:', error.message);
    }
});
```

For detailed information about specific parameters, responses, and error codes, please refer to the [official Appwrite documentation](https://appwrite.io/docs/references/cloud/client-web/databases).