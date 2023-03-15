# About

This package makes uploading files to S3 very simple by providing helper functions

<br/><br/>

# How to use

You can set the following environment variables. Alternatively, you can pass the config to the function directly.

    S3_UPLOAD_BUCKET="Bucket name"
    S3_UPLOAD_REGION="Region"
    S3_UPLOAD_URL="Custom URL"
    S3_UPLOAD_KEEP_ORIGINAL_URL="true|false"
    S3_UPLOAD_KEEP_ORIGINAL_FILENAME="true|false"

<br/><br/>

# Example

    import { uploadFile } from '@404-software/s3-upload'

    const imageUrl = await uploadFile({
      folder: 'users-images',
      file,
      config: {
        bucket: 'MY-S3-BUCKET',
        region: 'me-south-1',
        keepOriginalFilename: false.
        keepOriginalUrl: true,
      }, // ONLY if environment variables not set
    })
