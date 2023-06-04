require('dotenv').config()
import { deleteFile, deleteFiles, uploadFile, uploadFiles } from '../src'
import fs from 'fs'
import path from 'path'

// ENVIRONMENT VARIABLES ARE SET FOR THE TESTS

let fileUrl: string
describe('uploadFile', () => {
	it('should upload a file', async () => {
		const imagePath = path.join(__dirname, './images/image-1.jpg')
		const createReadStream = () => fs.createReadStream(imagePath)
		const filename = 'image-1.jpg'
		const mimetype = 'image/jpeg'

		fileUrl = await uploadFile({
			file: {
				createReadStream,
				filename,
				mimetype,
			},
		})

		console.log(fileUrl)

		expect(typeof fileUrl).toBe('string')
	})
})

describe('deleteFile', () => {
	it('should delete a file', async () => {
		const result = await deleteFile({ file: fileUrl })

		expect(result).toBe(undefined)
	})
})

let filesUrls: string[] = []
describe('uploadFiles', () => {
	it('should upload files', async () => {
		const images = [1, 2].map(val => {
			const imagePath = path.join(__dirname, `./images/image-${val}.jpg`)
			const createReadStream = () => fs.createReadStream(imagePath)
			const filename = `image-${val}.jpg`
			const mimetype = 'image/jpeg'

			return {
				createReadStream,
				filename,
				mimetype,
			}
		})

		filesUrls = await uploadFiles({ files: images })

		console.log(filesUrls)

		expect(filesUrls.length).toBe(2)
	})
})

describe('deleteFiles', () => {
	it('should delete files', async () => {
		const result = await deleteFiles({ files: filesUrls })

		expect(result).toBe(undefined)
	})
})
