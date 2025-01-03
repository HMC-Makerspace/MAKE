import multer from "multer";

// Setup file upload with multer
const storage = multer.diskStorage({
    // Set the destination for the file uploads
    destination: (req, file, cb) => {
        cb(null, process.env.FILE_TEMP_PATH);
    },
    // Set the filename for the file uploads to be unique
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, file.originalname + "-" + uniqueSuffix);
    },
});

const upload = multer({
    storage: storage,
    // Limit the file size to the maximum allowed size, and only allow one file
    // to be uploaded at a time
    limits: {
        fileSize: process.env.FILE_MAX_SIZE,
        files: 1,
    },
});

export default upload;
