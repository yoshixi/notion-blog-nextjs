import fs from 'fs'
const imagesDir = 'public/blogImages'
export const imagePath = (blockId) => {
  return imagesDir + '/' + blockId + '.png'
}


/// 一時ファイルの画像をバイナリとして取得する。ここで画像のフォーマットがわかる
const getTemporaryImage = async (url) => {
  try {
    console.log(url)
    const blob = await fetch(url).then((r) => r.blob())
    return blob
  } catch (error) {
    console.log(error)
    return null
  }
}


const isImageExist = (blockId) => {
  return fs.existsSync(imagePath(blockId))
}

const saveImage = (imageBinary, blockId) => {
  fs.writeFile(imagePath(blockId), imageBinary, (error) => {
    if (error) {
      console.log(error)
      throw error
    }
  })
}

export const downloadImageIfNeed = async (url, blockId) => {
  const blob = await getTemporaryImage(url)
  if (!blob) {
    return ''
  }
  if (!isImageExist(blockId)) {
    const binary = (await blob.arrayBuffer())
    const buffer = Buffer.from(binary)
    saveImage(buffer, blockId)
  }
}
