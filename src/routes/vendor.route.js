import { Router } from 'express';
import { VendorController } from '../controllers/vendor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createVendorSchema, vendorIdSchema, updateVendorSchema } from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createVendorSchema), VendorController.create);
router.get('/', VendorController.list);
router.get('/:id', validate(vendorIdSchema), VendorController.getById);
router.put('/:id', validate(updateVendorSchema), VendorController.update);

export default router;
