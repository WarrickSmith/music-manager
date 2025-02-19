# Appwrite Storage API - Node.js Server SDK Reference

This document provides a comprehensive overview of the Appwrite Storage API endpoints available in the Node.js Server SDK. The Storage API allows you to manage files and buckets in your Appwrite instance.

## Table of Contents
- [Initialize Client](#initialize-client)
- [Buckets](#buckets)
  - [Create Bucket](#create-bucket)
  - [List Buckets](#list-buckets)
  - [Get Bucket](#get-bucket)
  - [Update Bucket](#update-bucket)
  - [Delete Bucket](#delete-bucket)
- [Files](#files)
  - [Create File](#create-file)
  - [List Files](#list-files)
  - [Get File](#get-file)
  - [Update File](#update-file)
  - [Delete File](#delete-file)
  - [Get File Download](#get-file-download)
  - [Get File Preview](#get-file-preview)
  - [Get File View](#get-file-view)

## Initialize Client

Before using the Storage API, you need to initialize the Appwrite client:

```javascript
const { Client, Storage } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject('your-project-id')               // Your project ID
    .setKey('your-api-key');                    // Your secret API key

const storage = new Storage(client);
```

## Buckets

### Create Bucket

Create a new storage bucket.

```javascript
const bucket = await storage.createBucket(
    'unique_bucket_id',
    'Bucket Name',
    Permission.read(Role.any()),    // Read permissions
    Permission.write(Role.any()),   // Write permissions
    true,                          // Enabled?
    10000000,                      // Maximum file size in bytes
    ['image/jpeg', 'image/png'],   // Allowed file extensions
    true,                          // Enable file encryption
    true,                          // Enable maximum file size validation
    true,                          // Enable MIME type validation
);
```

### List Buckets

Get a list of all storage buckets.

```javascript
const bucketsList = await storage.listBuckets(
    ['enabled'],  // List of query filters
    'name',       // Order by field
    'asc',        // Order type (asc/desc)
    1,            // Offset
    20            // Limit
);
```

### Get Bucket

Get a storage bucket by its unique ID.

```javascript
const bucket = await storage.getBucket('bucket_id');
```

### Update Bucket

Update a storage bucket by its unique ID.

```javascript
const bucket = await storage.updateBucket(
    'bucket_id',
    'New Bucket Name',
    Permission.read(Role.any()),
    Permission.write(Role.any()),
    true,
    10000000,
    ['image/jpeg', 'image/png'],
    true,
    true,
    true
);
```

### Delete Bucket

Delete a storage bucket by its unique ID.

```javascript
await storage.deleteBucket('bucket_id');
```

## Files

### Create File

Create a new file in a specific bucket.

```javascript
const file = await storage.createFile(
    'bucket_id',
    'unique_file_id',
    InputFile.fromPath('./path/to/file.jpg'),
    [Permission.read(Role.any()), Permission.write(Role.any())]
);
```

### List Files

Get a list of all files from a specific bucket.

```javascript
const files = await storage.listFiles(
    'bucket_id',
    ['enabled'],  // List of query filters
    'name',       // Order by field
    'asc',        // Order type (asc/desc)
    1,            // Offset
    20            // Limit
);
```

### Get File

Get a file by its unique ID.

```javascript
const file = await storage.getFile('bucket_id', 'file_id');
```

### Update File

Update a file by its unique ID.

```javascript
const file = await storage.updateFile(
    'bucket_id',
    'file_id',
    [Permission.read(Role.any()), Permission.write(Role.any())]
);
```

### Delete File

Delete a file by its unique ID.

```javascript
await storage.deleteFile('bucket_id', 'file_id');
```

### Get File Download

Get a file's download URL.

```javascript
const downloadUrl = storage.getFileDownload('bucket_id', 'file_id');
```

### Get File Preview

Get a file's preview URL. This is useful for image files.

```javascript
const previewUrl = storage.getFilePreview(
    'bucket_id',
    'file_id',
    200,           // Width
    200,           // Height
    'center',      // Gravity
    'crop',        // Mode (crop/resize)
    100,           // Quality
    0,             // Border width
    'FF0000',      // Border color
    0,             // Border radius
    1,             // Opacity
    0,             // Rotation angle
    'FF0000',      // Background color
    'webp'         // Output format
);
```

### Get File View

Get a file's view URL.

```javascript
const viewUrl = storage.getFileView('bucket_id', 'file_id');
```

## Error Handling

All API calls can throw exceptions. It's recommended to wrap them in try-catch blocks:

```javascript
try {
    const file = await storage.getFile('bucket_id', 'file_id');
} catch (error) {
    console.error('Error:', error);
}
```

## Notes

1. All endpoints require proper initialization of the Appwrite client with valid credentials.
2. File operations are performed within buckets, so you need to create a bucket before working with files.
3. File size limits and allowed MIME types are defined at the bucket level.
4. Permissions can be set both at bucket and file levels.
5. Preview and view operations are particularly useful for image files.