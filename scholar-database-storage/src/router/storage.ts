import { Hono } from 'hono';
import { StorageController } from '@/controller/storage';

const StorageRouter = new Hono();

StorageRouter.post('/upload', StorageController.upload);
StorageRouter.get('/file/:filename', StorageController.getFile);
StorageRouter.delete('/file/:filename', StorageController.deleteFile);

export { StorageRouter };