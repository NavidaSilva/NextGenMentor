const multer = require("multer");
const path = require("path");
const fs = require("fs");

// common storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// for profile pictures
const profilePicFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype.toLowerCase());
  if (extname && mimetype) return cb(null, true);
  cb(new Error("Only .jpg, .jpeg, .png files are allowed"));
};

const uploadProfilePicture = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: profilePicFilter
});


//for mentorship query files
const queryFileFilter = (req, file, cb) => {
  const allowedExts = ['.pdf', '.docx', '.xlsx', '.mp4', '.jpeg', '.jpg', '.png'];
  const allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',      // xlsx
    'video/mp4',
    'image/jpeg',
    'image/png'
  ];

  const ext = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype.toLowerCase();

  if (allowedExts.includes(ext) && allowedMimeTypes.includes(mimetype)) {
    return cb(null, true);
  }

  cb(new Error("Only PDF, DOCX, XLSX, MP4, JPG, PNG files are allowed"));
};


const uploadQueryFile = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: queryFileFilter
});


module.exports = {
  uploadProfilePicture,
  uploadQueryFile
};
