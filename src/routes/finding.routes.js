import { Router } from 'express';
import { FindingController } from '../controllers/finding.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  listFindingsSchema,
  findingIdSchema,
  resolveFindingSchema,
  analyzeFindingsSchema
} from '../validations/index.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listFindingsSchema), FindingController.list);

// Must stay above '/:id', otherwise "summary" is matched as an id and rejected
// by the numeric coercion.
router.get('/summary', FindingController.summary);

// Server-sent events, not JSON. Same rule about staying above '/:id' applies.
router.post('/analyze', validate(analyzeFindingsSchema), FindingController.analyze);

router.get('/:id', validate(findingIdSchema), FindingController.getById);
router.patch('/:id/resolve', validate(resolveFindingSchema), FindingController.resolve);

export default router;
