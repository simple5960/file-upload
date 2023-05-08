const express = require("express")
const cors = require("cors")
const multer = require("multer")
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
const upload = multer({ dest: "uploads/" })

const CHUNK_DIR = "chunks/"

// 处理文件上传请求
app.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file
  const fileName = file.originalname
  const chunkIndex = req.body.index
  const chunkPath = path.join(CHUNK_DIR, fileName + "-" + chunkIndex)

  // 将上传的分片文件保存到磁盘
  fs.renameSync(file.path, chunkPath)

  res.status(200).json({ message: "Chunk uploaded successfully" })
})

// 处理文件合并请求
app.post("/merge", (req, res) => {
  const fileName = req.body.fileName
  const filePath = path.join(__dirname, "resource", fileName)
  console.log(filePath)

  // 将所有分片文件合并到一个文件中
  // const chunkDir = path.join(__dirname, CHUNK_DIR + fileName)
  const chunkDir = path.join(__dirname, CHUNK_DIR)
  const chunkPaths = fs.readdirSync(chunkDir)
  chunkPaths.sort(
    (a, b) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1])
  )
  const writableStream = fs.createWriteStream(filePath)
  chunkPaths.forEach((chunkPath) => {
    const readableStream = fs.createReadStream(path.join(chunkDir, chunkPath))
    readableStream.pipe(writableStream, { end: false })
    readableStream.on("end", () => {
      console.log("end")
      fs.unlinkSync(path.join(chunkDir, chunkPath))
      res.status(200).json({ message: "File merged successfully" })
    })
  })
  writableStream.on("finish", () => {
    fs.rmdirSync(chunkDir)
    res.status(200).json({ message: "File merged successfully" })
  })
})

// 启动服务器
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
