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

    S3_UPLOAD_ACCESS_KEY_ID || AWS_ACCESS_KEY_ID="AWS_SECRET"

    S3_UPLOAD_SECRET_ACCESS_KEY || AWS_SECRET_ACCESS_KEY="AWS_KEY"

<br/><br/>

# Examples

    import { uploadFile, deleteFile } from '@404-software/s3-upload'

    const user = db.user.find(1)

    // Upload new image
    const imageUrl = await uploadFile({
      folder: 'users-images',
      file: newImage,
      config: {
        bucket: 'MY-S3-BUCKET',
        region: 'me-south-1',
        keepOriginalFilename: false.
        keepOriginalUrl: true,
        credentials: {
          secretAccessKey: "AWS_SECRET",
          accessKeyId: "AWS_KEY"
        }
      }, // ONLY if environment variables not set
    })

    // delete old image
    await deleteImage({ file: user.image }) // Key is extracted automatically
