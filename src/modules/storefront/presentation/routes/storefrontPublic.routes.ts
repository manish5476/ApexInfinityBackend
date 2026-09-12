import { Router } from 'express';
import { StorefrontPublicController } from '../controllers/storefrontPublic.controller';

export function createStorefrontPublicRoutes(controller: StorefrontPublicController): Router {
  const router = Router();

  // Root info / health
  router.get('/', (req, res) =>
    res.status(200).json({ status: 'success', message: 'Storefront Public API' })
  );

  // Framework standalone shortcuts
  router.get('/pages/:slug', controller.getPageHandler);
  router.post('/orders', controller.checkoutHandler);

  // Store Info
  router.get('/:organizationSlug', controller.getOrganizationInfo);
  router.get('/:organizationSlug/sitemap', controller.getSitemap);

  // Product & Catalogue
  router.get('/:organizationSlug/meta', controller.getStoreMetadata);
  router.get('/:organizationSlug/filters', controller.getShopFilters);
  router.get('/:organizationSlug/search', controller.searchProducts);
  router.get('/:organizationSlug/categories', controller.getCategories);
  router.get('/:organizationSlug/brands', controller.getBrands);
  router.get('/:organizationSlug/tags', controller.getTags);
  router.get('/:organizationSlug/products', controller.getProducts);
  router.get('/:organizationSlug/products/:productSlug', controller.getProductBySlug);

  // Cart
  router.get('/:organizationSlug/cart', controller.getCart);
  router.post('/:organizationSlug/cart/items', controller.addItem);
  router.patch('/:organizationSlug/cart/items/:cartItemId', controller.updateItemQuantity);
  router.delete('/:organizationSlug/cart/items/:cartItemId', controller.removeItem);
  router.delete('/:organizationSlug/cart', controller.clearCart);
  router.get('/:organizationSlug/cart/validate', controller.validateCart);
  router.post('/:organizationSlug/cart/coupons', controller.applyCoupon);
  router.post('/:organizationSlug/cart/shipping-estimate', controller.estimateShipping);
  router.post('/:organizationSlug/cart/merge', controller.mergeCart);

  // Storefront Customer, Checkout, Orders
  router.post('/:organizationSlug/account/register', controller.register);
  router.post('/:organizationSlug/account/login', controller.login);
  router.post('/:organizationSlug/account/logout', controller.logout);
  router.post('/:organizationSlug/account/forgot-password', controller.forgotPassword);
  router.post('/:organizationSlug/account/reset-password', controller.resetPassword);
  router.post('/:organizationSlug/account/update-password', controller.updatePassword);
  router.get('/:organizationSlug/account/me', controller.me);
  router.post('/:organizationSlug/account/addresses', controller.addAddress);
  router.put('/:organizationSlug/account/addresses/:addressId', controller.updateAddress);
  router.post('/:organizationSlug/account/wishlist/toggle', controller.toggleWishlist);
  router.get('/:organizationSlug/account/orders', controller.getOrders);
  router.post('/:organizationSlug/checkout', controller.checkout);
  router.get('/:organizationSlug/orders/:orderNumber', controller.trackOrder);

  // Page Renderer Catch-all (must remain last)
  router.get('/:organizationSlug/:pageSlug', controller.getPublicPage);

  return router;
}
