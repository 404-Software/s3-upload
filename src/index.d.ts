export type S3UploadConfig = {
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

export interface S3UploadCreateUploadStream {
	createReadStream: () => fs.ReadStream
	filename: string
	mimetype: string
	folder?: string
	config?: Config
}

export type S3UploadUploadDone = {
	Location: string
	Key: string
}

export interface S3UploadUploadFile {
	file: File
	folder?: string
	config?: Config
}

export interface S3UploadUploadFiles {
	files: Array<string | File>
	folder?: string
	config?: Config
}

export interface S3UploadDeleteFile {
	file?: string
	config?: Config
}

export interface S3UploadDeleteFiles {
	files?: string[]
	config?: Config
}

type File =
	| {
			file: {
				createReadStream: () => fs.ReadStream
				filename: string
				mimetype: string
			}
	  }
	| string

declare module '@404-software/s3-upload' {
	export declare function uploadFile(data: S3UploadUploadFile): Promise<string>

	export declare function uploadFiles(
		data: S3UploadUploadFiles,
	): Promise<string[]>

	export declare function deleteFile(data: S3UploadDeleteFile): Promise<void>

	export declare function deleteFiles(data: S3UploadDeleteFiles): Promise<void>
}
