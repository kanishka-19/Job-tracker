const express = require('express');
const router = express.Router({ mergeParams: true }); // 👈 important
const {addNote, deleteNote, getNotes} = require('../controllers/notesController');
const authJWT = require('../middleware/authJWT');
const { addNoteRules, deleteNoteRules, getNotesRules } = require('../validators/notesValidator');
const validate = require('../middleware/validateMiddleware');

// All routes below are protected
router.use(authJWT);

router.get('/', getNotesRules, validate, getNotes);
router.post('/', addNoteRules, validate, addNote);
router.delete('/:noteId', deleteNoteRules, validate, deleteNote);


module.exports = router;
