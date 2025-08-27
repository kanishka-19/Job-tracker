const multer = require('multer');

const storage = multer.memoryStorage(); // keep file in memory before upload
const upload = multer({ storage });

module.exports = upload;