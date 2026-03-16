import express from 'express';
import authRoutes from '../routes/auth.routes.js';
import cartItemRoutes from '../routes/cartItem.routes.js';
import categoryRoutes from '../routes/category.routes.js';
import documentTypeRoutes from '../routes/documentType.routes.js';
import inventoryMovementRoutes from '../routes/inventoryMovement.routes.js';
import invoiceRoutes from '../routes/invoice.routes.js';
import invoiceDetailRoutes from '../routes/invoiceDetail.routes.js';
import orderRoutes from '../routes/order.routes.js';
import orderDetailRoutes from '../routes/orderDetail.routes.js';
import paymentRoutes from '../routes/payment.routes.js';
import productRoutes from '../routes/product.routes.js';
import productPromotionRoutes from '../routes/productPromotion.routes.js';
import productVariantRoutes from '../routes/productVariant.routes.js';
import promotionRoutes from '../routes/promotion.routes.js';
import purchaseDetailRoutes from '../routes/purchaseDetail.routes.js';
import purchaseOrderRoutes from '../routes/purchaseOrder.routes.js';
import roleRoutes from '../routes/role.routes.js';
import shoppingCartRoutes from '../routes/shoppingCart.routes.js';
import userRoutes from '../routes/user.routes.js';
import userAuthorityRoutes from '../routes/userAuthority.routes.js';

// Create an instance of the Express application
const app = express();
// Define the base path for the API
const NAME_API = '/api/v1';
// Middleware to handle JSON
app.use(express.json());

// Routes for the API
app.use(NAME_API, authRoutes);
app.use(NAME_API, cartItemRoutes);
app.use(NAME_API, categoryRoutes);
app.use(NAME_API, documentTypeRoutes);
app.use(NAME_API, inventoryMovementRoutes);
app.use(NAME_API, invoiceRoutes);
app.use(NAME_API, invoiceDetailRoutes);
app.use(NAME_API, orderRoutes);
app.use(NAME_API, orderDetailRoutes);
app.use(NAME_API, paymentRoutes);
app.use(NAME_API, productRoutes);
app.use(NAME_API, productPromotionRoutes);
app.use(NAME_API, productVariantRoutes);
app.use(NAME_API, promotionRoutes);
app.use(NAME_API, purchaseDetailRoutes);
app.use(NAME_API, purchaseOrderRoutes);
app.use(NAME_API, roleRoutes);
app.use(NAME_API, shoppingCartRoutes);
app.use(NAME_API, userRoutes);
app.use(NAME_API, userAuthorityRoutes);

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Endpoint losses 404, not found'
  });
});

export default app;