import express from 'express'
const router = express.Router();
import {
  adminRegistration,
  adminLogin,
  adminLogout
} from '../Controller/adminAuthCtrl.js'


router.post('/admin-register', adminRegistration)
router.post('/admin-login', adminLogin)
router.post('/admin-logout', adminLogout)


export default router