# Appwrite Storage API Guide - Web Client (JavaScript)

This guide provides a comprehensive overview of the Appwrite Storage API endpoints for the Web JavaScript client.

## Initialize Storage Client

Before using any storage endpoints, initialize the Appwrite client and storage:

```javascript
import { Client, Storage } from "appwrite";

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('[PROJECT_ID]');

const storage = new Storage(client);
```

## List Buckets

Retrieve a list of all storage buckets.

```javascript
const response = await storage.listBuckets();
```

## Create File

Upload a new file to a storage bucket.

```javascript
const response = await storage.createFile(
    '[BUCKET_ID]',
    '[FILE_ID]',
    document.getElementById('uploader').files[0]
);
```

## List Files

Get a list of all files within a bucket.

```javascript
const response = await storage.listFiles(
    '[BUCKET_ID]'
);
```

## Get File

Get a file by its unique ID.

```javascript
const response = await storage.getFile(
    '[BUCKET_ID]',
    '[FILE_ID]'
);
```

## Delete File

Delete a file by its unique ID.

```javascript
const response = await storage.deleteFile(
    '[BUCKET_ID]',
    '[FILE_ID]'
);
```

## Get File Download

Get a file's download URL.

```javascript
const result = storage.getFileDownload(
    '[BUCKET_ID]',
    '[FILE_ID]'
);
```

## Get File Preview

Get a file's preview URL. This is particularly useful for image files.

```javascript
const result = storage.getFilePreview(
    '[BUCKET_ID]',
    '[FILE_ID]'
);
```

## Get File View

Get a file's view URL.

```javascript
const result = storage.getFileView(
    '[BUCKET_ID]',
    '[FILE_ID]'
);
```

## Update File

Update a file by its unique ID.

```javascript
const response = await storage.updateFile(
    '[BUCKET_ID]',
    '[FILE_ID]',
    '[FILE_NAME]'
);
```

## Create Bucket

Create a new storage bucket.

```javascript
const response = await storage.createBucket(
    '[BUCKET_ID]',
    '[BUCKET_NAME]'
);
```

## Get Bucket

Get a storage bucket by its unique ID.

```javascript
const response = await storage.getBucket(
    '[BUCKET_ID]'
);
```

## Update Bucket

Update a storage bucket by its unique ID.

```javascript
const response = await storage.updateBucket(
    '[BUCKET_ID]',
    '[BUCKET_NAME]'
);
```

## Delete Bucket

Delete a storage bucket by its unique ID.

```javascript
const response = await storage.deleteBucket(
    '[BUCKET_ID]'
);
```

## Important Notes

1. Replace `[PROJECT_ID]`, `[BUCKET_ID]`, `[FILE_ID]`, `[BUCKET_NAME]`, and `[FILE_NAME]` with your actual values.
2. File uploads are limited to 5MB per chunk when using content-range header.
3. Make sure you have the necessary permissions set up in your Appwrite console.
4. All API calls return promises that need to be handled appropriately.
5. Error handling should be implemented using try-catch blocks in production code.

## Example Error Handling

Here's an example of how to properly handle errors:

```javascript
try {
    const response = await storage.createFile(
        '[BUCKET_ID]',
        '[FILE_ID]',
        document.getElementById('uploader').files[0]
    );
    console.log('File uploaded successfully:', response);
} catch (error) {
    console.error('Error uploading file:', error);
}
```