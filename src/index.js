const { DeleteObjectCommand, S3Client } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const stream = require('stream')

const S3_UPLOAD_BUCKET = process.env.S3_UPLOAD_BUCKET
const S3_UPLOAD_REGION = process.env.S3_UPLOAD_REGION
const S3_UPLOAD_URL = process.env.S3_UPLOAD_URL
const S3_UPLOAD_KEEP_ORIGINAL_URL =
	process.env.S3_UPLOAD_KEEP_ORIGINAL_URL === 'true'
const S3_UPLOAD_KEEP_ORIGINAL_FILENAME =
	process.env.S3_UPLOAD_KEEP_ORIGINAL_FILENAME === 'true'

const S3_UPLOAD_ACCESS_KEY_ID =
	process.env.S3_UPLOAD_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
const S3_UPLOAD_SECRET_ACCESS_KEY =
	process.env.S3_UPLOAD_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY

function getFileKey(key, config) {
	const url = getUrl(config?.url)
	const splitBy = url ? `${url}/` : 'amazonaws.com/'

	const split = key.split(splitBy)

	return split.length === 2 ? split[1] : key
}

function getExtension(filename) {
	return `.${filename.split('.').pop()}`
}

function getRegion(region) {
	const clientRegion = S3_UPLOAD_REGION || region

	if (!clientRegion) throw new Error('No region provided as env var or config')

	return clientRegion
}

function getBucket(bucket) {
	const clientBucket = S3_UPLOAD_BUCKET || bucket

	if (!clientBucket) throw new Error('No bucket provided as env var or config')

	return clientBucket
}

function getUrl(url) {
	const clientUrl = S3_UPLOAD_URL || url

	return clientUrl
}

function getKeepOriginalUrl(keepOriginalUrl) {
	const clientKeepOriginalUrl =
		S3_UPLOAD_KEEP_ORIGINAL_URL === 'true' || keepOriginalUrl

	return clientKeepOriginalUrl
}

function getKeepOriginalFilename(keepOriginalFilename) {
	const clientKeepOriginalFilename =
		S3_UPLOAD_KEEP_ORIGINAL_FILENAME === 'true' || keepOriginalFilename

	return clientKeepOriginalFilename
}

function getCredentials(credentials) {
	const clientCredentials =
		S3_UPLOAD_ACCESS_KEY_ID && S3_UPLOAD_SECRET_ACCESS_KEY
			? {
					accessKeyId: S3_UPLOAD_ACCESS_KEY_ID,
					secretAccessKey: S3_UPLOAD_SECRET_ACCESS_KEY,
			  }
			: credentials

	return clientCredentials
}

async function createUploadStream({
	createReadStream,
	filename,
	mimetype,
	folder,
	config,
}) {
	const url = getUrl(config?.url)
	const bucket = getBucket(config?.bucket)
	const region = getRegion(config?.region)
	const keepOriginalUrl = getKeepOriginalUrl(config?.keepOriginalUrl)
	const keepOriginalFilename = getKeepOriginalFilename(
		config?.keepOriginalFilename,
	)
	const credentials = getCredentials(config?.credentials)
	const fileExtension = getExtension(filename)

	const passThroughStream = new stream.PassThrough()

	const upload = new Upload({
		client: new S3Client({ region, credentials }),
		params: {
			Bucket: bucket,
			Key: `${folder ? `${folder}/` : ''}${
				keepOriginalFilename ? filename : `${Date.now()}${fileExtension}`
			}`,
			Body: passThroughStream,
			ACL: 'public-read',
			ContentType: mimetype,
		},
		leavePartsOnError: false,
	})

	createReadStream().pipe(passThroughStream)

	const file = await upload.done()

	return {
		Location:
			!url || keepOriginalUrl
				? file.Location
				: file.Location.replace(`${bucket}.s3.${region}.amazonaws.com`, url),
	}
}

const uploadFile = async ({ file, folder, config }) => {
	if (typeof file === 'string') return file

	const { createReadStream, filename, mimetype } = file.file

	const { Location } = await createUploadStream({
		createReadStream,
		filename,
		mimetype,
		folder,
		config,
	})

	return Location
}

const uploadFiles = async ({ files, folder, config }) =>
	await Promise.all(
		files.map(async file => {
			if (typeof file === 'string') return file

			const { createReadStream, filename, mimetype } = file.file

			return new Promise((resolve, reject) =>
				createUploadStream({
					createReadStream,
					folder,
					filename,
					mimetype,
					config,
				}).then(({ Location }) => (Location ? resolve(Location) : reject())),
			)
		}),
	)

const deleteFile = async ({ file, config }) => {
	const region = getRegion(config?.region)
	const credentials = getCredentials(config?.credentials)
	const bucket = getBucket(config?.bucket)
	const key = getFileKey(file, config)

	if (typeof file !== 'string') return

	const client = new S3Client({ region, credentials })

	const command = new DeleteObjectCommand({
		Bucket: bucket,
		Key: key,
	})

	await client.send(command)
}

const deleteFiles = async ({ files, config }) => {
	if (!files) return

	await Promise.all(
		files.map(async file => {
			if (typeof file !== 'string') return

			await deleteFile({ file, config })
		}),
	)
}

module.exports = {
	uploadFile,
	uploadFiles,
	deleteFile,
	deleteFiles,
}
