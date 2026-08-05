import { Router } from 'express';
import { getVendors, createVendor, getVendorById, updateVendor } from '../controllers/vendor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', createVendor);
router.get('/', getVendors);
router.get('/:id', getVendorById);
router.put('/:id', updateVendor);

export default router;
