import * as productService from "../services/product.service.js";
import { sendSuccess } from "../utils/response.js";
import { sendCsv, toCsv } from "../utils/csv.js";

export const getMarketplace = async (req, res) => {
  const { items, meta } = await productService.listMarketplace(req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const getMine = async (req, res) => {
  const { items, meta } = await productService.listOwnProducts(req.user, req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const getForModeration = async (req, res) => {
  const { items, meta } = await productService.listForModeration(req.valid.query);
  sendSuccess(res, { data: items, meta });
};

export const exportForModeration = async (req, res) => {
  const products = await productService.exportForModeration(req.valid.query);
  const csv = toCsv(
    [
      { label: "Name", value: (p) => p.name },
      { label: "Category", value: (p) => p.category },
      { label: "Price", value: (p) => p.price },
      { label: "Age (years)", value: (p) => p.age },
      { label: "Status", value: (p) => p.status },
      { label: "Seller", value: (p) => p.seller?.name },
      { label: "Seller email", value: (p) => p.seller?.email },
      { label: "Created", value: (p) => p.createdAt },
    ],
    products
  );
  sendCsv(res, `products-${new Date().toISOString().slice(0, 10)}.csv`, csv);
};

export const getProduct = async (req, res) => {
  sendSuccess(res, { data: await productService.getProduct(req.valid.params.id, req.user) });
};

export const addProduct = async (req, res) => {
  const product = await productService.createProduct(req.user, req.valid.body);
  sendSuccess(res, { status: 201, message: "Product submitted for review", data: product });
};

export const editProduct = async (req, res) => {
  const product = await productService.updateProduct(req.user, req.valid.params.id, req.valid.body);
  sendSuccess(res, { message: "Product updated", data: product });
};

export const deleteProduct = async (req, res) => {
  await productService.deleteProduct(req.user, req.valid.params.id, req.id);
  sendSuccess(res, { message: "Product deleted" });
};

export const updateProductStatus = async (req, res) => {
  const product = await productService.updateProductStatus(req.user, req.valid.params.id, req.valid.body.status, req.id);
  sendSuccess(res, { message: `Product ${product.status}`, data: product });
};

export const uploadImage = async (req, res) => {
  const product = await productService.addProductImage(req.user, req.valid.params.id, req.file);
  sendSuccess(res, { status: 201, message: "Image uploaded", data: product });
};

export const removeImage = async (req, res) => {
  const product = await productService.removeProductImage(req.user, req.valid.params.id, req.valid.body.url);
  sendSuccess(res, { message: "Image removed", data: product });
};
