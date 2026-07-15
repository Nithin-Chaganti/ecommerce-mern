
import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Loader2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToast } from '../../context/ToastContext';

const ProductModal = ({ isOpen, onClose, productToEdit, onSaveSuccess }) => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPercent: 0,
    stock: '',
    category: '',
    images: []
  });

  // Fetch categories list on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data || []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Pre-fill form if editing
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        discountPercent: productToEdit.discountPercent || 0,
        stock: productToEdit.stock || '',
        category: typeof productToEdit.category === 'object' ? productToEdit.category._id : productToEdit.category || '',
        images: productToEdit.images || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        discountPercent: 0,
        stock: '',
        category: '',
        images: []
      });
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' || name === 'discountPercent' 
        ? (value === '' ? '' : Number(value)) 
        : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 8) {
      showToast('You can upload a maximum of 8 images per product.', 'warning');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    files.forEach((file) => {
      uploadData.append('images', file);
    });

    try {
      const response = await api.post('/uploads/images', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrls = response.data.data.urls || [];
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls]
      }));
      showToast('Images uploaded successfully to storage!', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast(err.response?.data?.message || 'Failed to upload images.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Product title is required';
    if (!formData.description.trim()) newErrors.description = 'Product description is required';
    if (formData.price === '' || formData.price < 0) newErrors.price = 'Price must be a positive number';
    if (formData.stock === '' || formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (formData.discountPercent < 0 || formData.discountPercent > 90) newErrors.discountPercent = 'Discount must be between 0% and 90%';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (formData.images.length === 0) newErrors.images = 'At least one product image is required';
    if (formData.images.length > 8) newErrors.images = 'Maximum of 8 images allowed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (productToEdit) {
        await api.patch(`/products/${productToEdit._id}`, formData);
        showToast('Product updated successfully and submitted for moderation!', 'success');
      } else {
        await api.post('/products', formData);
        showToast('Product submitted for admin review successfully!', 'success');
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save product:', err);
      showToast(err.response?.data?.message || 'Failed to save product data.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col animate-slide-up mx-4">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles size={20} />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              {productToEdit ? 'Edit Product Parameters' : 'Add New Product Listing'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Product Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Leather Jacket Classic"
                error={errors.title}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details about features, specifications, and sizes..."
                rows="4"
                className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 resize-none ${
                  errors.description ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200'
                }`}
                required
              />
              {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <Input
                label="Base Price (₹)"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 1299"
                error={errors.price}
                required
              />
            </div>

            <div>
              <Input
                label="Discount (%)"
                type="number"
                name="discountPercent"
                value={formData.discountPercent}
                onChange={handleChange}
                placeholder="e.g. 10 (optional)"
                error={errors.discountPercent}
              />
            </div>

            <div>
              <Input
                label="Inventory Stock Quantity"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                placeholder="e.g. 50"
                error={errors.stock}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 text-sm bg-slate-50 border rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 ${
                  errors.category ? 'border-rose-300 focus:border-rose-500 bg-rose-50/30' : 'border-slate-200'
                }`}
                required
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-rose-500 text-xs mt-1">{errors.category}</p>}
            </div>
          </div>

          {/* Image Upload Block */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Product Images (Max 8)
            </label>

            {/* Upload Area */}
            <div className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors relative ${
              errors.images ? 'border-rose-300 bg-rose-50/10' : 'border-slate-200 hover:bg-slate-50/50'
            }`}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <span className="text-sm font-medium text-slate-600">Uploading files to cloud storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400" size={32} />
                    <span className="text-sm font-medium text-slate-700">Click to upload product photos</span>
                    <span className="text-xs text-slate-400">Supports PNG, JPG, JPEG (Max 8 images)</span>
                  </>
                )}
              </div>
            </div>
            {errors.images && <p className="text-rose-500 text-xs">{errors.images}</p>}

            {/* Thumbnail previews */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-2">
                {formData.images.map((imgUrl, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl border border-slate-100 overflow-hidden bg-slate-50">
                    <img src={imgUrl} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white rounded-xl"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={uploading}
          >
            {productToEdit ? 'Save Changes' : 'Submit Product'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
