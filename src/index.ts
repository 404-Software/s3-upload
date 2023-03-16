import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { randomUUID } from 'crypto'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import stream from 'stream'

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

export interface S3UploadConfig {
	region?: string
	bucket?: string
	url?: string
	credentials?: {
		secretAccessKey: string
		accessKeyId: string
	}
	keepOriginalFilename?: boolean
	keepOriginalUrl?: boolean
}

function getFileKey(key: string, config?: S3UploadConfig) {
	const url = getUrl(config?.url)

	const split1 = url ? key.split(`${url}/`) : []
	const split2 = key.split('amazonaws.com/')

	return split1.length === 2 ? split1[1] : split2.length === 2 ? split2[1] : key
}

function getExtension(filename: string) {
	return `.${filename.split('.').pop()}`
}

function getRegion(region?: string) {
	const clientRegion = S3_UPLOAD_REGION || region

	if (!clientRegion) throw new Error('No region provided as env var or config')

	return clientRegion
}

function getBucket(bucket?: string) {
	const clientBucket = S3_UPLOAD_BUCKET || bucket

	if (!clientBucket) throw new Error('No bucket provided as env var or config')

	return clientBucket
}

function getUrl(url?: string) {
	const clientUrl = S3_UPLOAD_URL || url

	return clientUrl
}

function getKeepOriginalUrl(keepOriginalUrl?: boolean) {
	const clientKeepOriginalUrl = S3_UPLOAD_KEEP_ORIGINAL_URL || keepOriginalUrl

	return clientKeepOriginalUrl
}

function getKeepOriginalFilename(keepOriginalFilename?: boolean) {
	const clientKeepOriginalFilename =
		S3_UPLOAD_KEEP_ORIGINAL_FILENAME || keepOriginalFilename

	return clientKeepOriginalFilename
}

function getCredentials(credentials?: S3UploadConfig['credentials']) {
	const clientCredentials =
		S3_UPLOAD_ACCESS_KEY_ID && S3_UPLOAD_SECRET_ACCESS_KEY
			? {
					accessKeyId: S3_UPLOAD_ACCESS_KEY_ID,
					secretAccessKey: S3_UPLOAD_SECRET_ACCESS_KEY,
			  }
			: credentials

	return clientCredentials
}

export interface S3UploadCreateUploadStream {
	createReadStream: () => fs.ReadStream
	filename: string
	mimetype: string
	folder?: string
	config?: S3UploadConfig
}

type S3UploadUploadDone = {
	Location: string
	Key: string
}

async function createUploadStream({
	createReadStream,
	filename,
	mimetype,
	folder,
	config,
}: S3UploadCreateUploadStream) {
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
				keepOriginalFilename ? filename : `${randomUUID()}${fileExtension}`
			}`,
			Body: passThroughStream,
			ACL: 'public-read',
			ContentType: mimetype,
		},
		leavePartsOnError: false,
	})

	createReadStream().pipe(passThroughStream)

	const file = (await upload.done()) as S3UploadUploadDone

	return {
		Location:
			!url || keepOriginalUrl
				? file.Location
				: file.Location.replace(`${bucket}.s3.${region}.amazonaws.com`, url),
	}
}

export type S3UploadFile =
	| {
			file: {
				createReadStream: () => fs.ReadStream
				filename: string
				mimetype: string
			}
	  }
	| string

export interface S3UploadUploadFile {
	file: S3UploadFile
	folder?: string
	config?: S3UploadConfig
}

export const uploadFile = async ({
	file,
	folder,
	config,
}: S3UploadUploadFile) => {
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

export interface S3UploadUploadFiles {
	files: Array<string | S3UploadFile>
	folder?: string
	config?: S3UploadConfig
}

export const uploadFiles = async ({
	files,
	folder,
	config,
}: S3UploadUploadFiles) =>
	await Promise.all(
		files.map(async file => {
			if (typeof file === 'string') return file

			return await uploadFile({ file, folder, config })
		}),
	)

export interface S3UploadDeleteFile {
	file?: string
	config?: S3UploadConfig
}

export const deleteFile = async ({ file, config }: S3UploadDeleteFile) => {
	if (typeof file !== 'string') return

	const region = getRegion(config?.region)
	const credentials = getCredentials(config?.credentials)
	const bucket = getBucket(config?.bucket)
	const key = getFileKey(file, config)

	const client = new S3Client({ region, credentials })

	const command = new DeleteObjectCommand({
		Bucket: bucket,
		Key: key,
	})

	await client.send(command)
}

export interface S3UploadDeleteFiles {
	files?: string[]
	config?: S3UploadConfig
}

export const deleteFiles = async ({ files, config }: S3UploadDeleteFiles) => {
	if (!files) return

	await Promise.all(
		files.map(async file => {
			if (typeof file !== 'string') return

			await deleteFile({ file, config })
		}),
	)
}
