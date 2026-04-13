const express = require('express');
const { createJob, getJobs, getApplicants } = require('../controllers/jobController');

const router = express.Router();

router.route('/')
    .post(createJob)
    .get(getJobs);

router.get('/:id/applicants', getApplicants);

module.exports = router;
