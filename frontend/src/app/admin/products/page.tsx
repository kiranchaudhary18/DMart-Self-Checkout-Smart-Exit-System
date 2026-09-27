"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  Loader2,
  FolderPlus,
  Layers
} from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Product, Category } from "@/types/product";
import { 
  getAdminProducts, 
  deleteAdminProduct, 
  createAdminProduct, 
  updateAdminProduct,
  getCategories,
  createCategory,
  updateCategory
} from "@/lib/api/adminProducts";
import { useToast } from "@/hooks/useToast";
import { handleApiError } from "@/lib/utils/errorHandler";

export default function AdminProductsPage() {
  const { success, error: toastError, info } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "", description: "", barcode: "", sku: "", price: 0, 
    initial_stock: 0, gst_percentage: 0, unit: "PIECE", is_active: true
  });
  const [categorySearch, setCategorySearch] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Category Management State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({ name: "", description: "", is_active: true });
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setCategoriesError("Failed to load categories");
      console.error("Failed to load categories:", err);
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { page: currentPage };
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (statusFilter !== "ALL") params.is_active = statusFilter === "ACTIVE";

      const data = await getAdminProducts(params);
      
      // Handle both paginated and non-paginated responses based on backend schema
      if ((data as any).results) {
        setProducts(data.results);
        setTotalPages(Math.ceil(data.count / 10)); // Assuming page size 10
      } else {
        setProducts(data as any);
        setTotalPages(1);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load products from server.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [loadProducts]);

  const handleAddClick = () => {
    setSelectedProduct(null);
    setFormData({
      name: "", description: "", barcode: "", sku: "", price: 0, 
      initial_stock: 0, gst_percentage: 0, unit: "PIECE", is_active: true
    });
    setCategorySearch("");
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      ...product,
      category: typeof product.category === 'object' ? product.category.id : product.category
    });
    setCategorySearch(typeof product.category === 'object' ? product.category.name : (categories.find(c => c.id === product.category)?.name || ""));
    setImageFile(null);
    setImagePreview(product.image || null);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormOpen(false);
    setIsDeleteOpen(false);
    setIsCategoryManagerOpen(false);
    setSelectedProduct(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categorySearch.trim()) {
      setFormError("Category is required.");
      return;
    }
    
    setIsSaving(true);
    setFormError(null);
    try {
      // Handle Category Creation or Selection
      let selectedCategoryId = null;
      const existingCat = categories.find(c => c.name.toLowerCase() === categorySearch.trim().toLowerCase());
      
      if (existingCat) {
        selectedCategoryId = existingCat.id;
      } else {
        // Create new category on the fly
        const newCat = await createCategory({ name: categorySearch.trim(), is_active: true });
        selectedCategoryId = newCat.id;
        // Refresh categories list
        loadCategories();
      }

      let finalPayload: Partial<Product> | FormData = { ...formData, category: selectedCategoryId };

      if (imageFile) {
        const payloadData = new FormData();
        const basePayload = { ...formData, category: selectedCategoryId };
        Object.keys(basePayload).forEach(key => {
          if (basePayload[key as keyof typeof basePayload] !== undefined && basePayload[key as keyof typeof basePayload] !== null) {
            payloadData.append(key, basePayload[key as keyof typeof basePayload] as string);
          }
        });
        payloadData.append('image', imageFile);
        finalPayload = payloadData;
      }

      if (selectedProduct) {
        await updateAdminProduct(selectedProduct.id, finalPayload);
        success("Product updated successfully", "Product Saved");
      } else {
        await createAdminProduct(finalPayload);
        success("Product created successfully", "Product Saved");
      }
      setIsFormOpen(false);
      loadProducts();
    } catch (err: any) {
      setFormError(handleApiError(err) || "An error occurred saving the product.");
      toastError(handleApiError(err), "Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteAdminProduct(selectedProduct.id);
      setIsDeleteOpen(false);
      success("Product deleted successfully", "Product Deleted");
      loadProducts();
    } catch (err: any) {
      toastError(handleApiError(err), "Failed to delete product");
      setIsDeleteOpen(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    setCategoryError(null);
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, categoryForm);
        success("Category updated successfully", "Category Saved");
      } else {
        await createCategory(categoryForm);
        success("Category created successfully", "Category Saved");
      }
      setIsCategoryFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setCategoryError(handleApiError(err) || "Failed to save category");
      toastError(handleApiError(err), "Failed to save category");
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleAddCategoryClick = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: "", description: "", is_active: true });
    setCategoryError(null);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({ ...category });
    setCategoryError(null);
    setIsCategoryFormOpen(true);
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Products</h1>
            <p className="text-slate-500 text-sm mt-1">Manage product catalog, pricing, and inventory levels.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="text" 
                  placeholder="Search by name, SKU, or barcode..." 
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center text-sm text-slate-500 mr-2">
                  <Filter className="w-4 h-4 mr-2" /> Filters
                </div>
                
                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.name}</option>
                  ))}
                </select>

                <select 
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="w-full overflow-x-auto bg-white min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                <p className="text-slate-500 text-sm">Loading products...</p>
              </div>
            ) : error ? (
              <ErrorState 
                title="Failed to load products" 
                message={error} 
                onRetry={loadProducts} 
              />
            ) : products.length === 0 ? (
              <EmptyState 
                icon={PackageSearch}
                title="No products found"
                description={searchTerm || statusFilter !== "ALL" || categoryFilter !== "ALL" 
                  ? "Try adjusting your filters or search terms."
                  : "Get started by adding your first product to the catalog."}
                actionLabel={!(searchTerm || statusFilter !== "ALL" || categoryFilter !== "ALL") ? "Add Product" : undefined}
                onAction={handleAddClick}
              />
            ) : (
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <th className="p-4 pl-6 w-16">Image</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Product Name <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4">SKU/Barcode</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors group">
                      <div className="flex items-center">Price <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" /></div>
                    </th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-md border border-slate-200" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-400">IMG</div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-900">{product.name}</td>
                      <td className="p-4 text-slate-500 font-mono text-xs">
                        <div>{product.sku}</div>
                        <div className="text-[10px] text-slate-400">{product.barcode}</div>
                      </td>
                      <td className="p-4 text-slate-600">
                        {typeof product.category === 'object' ? product.category.name : product.category}
                      </td>
                      <td className="p-4 font-medium">₹{Number(product.price).toFixed(2)}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <span className={`font-medium ${product.current_stock === 0 ? 'text-red-600' : 'text-slate-700'}`}>
                            {product.current_stock ?? 0}
                          </span>
                          <span className="text-xs text-slate-500 ml-1"> {product.unit}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        {product.is_active ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-blue-600 p-0" onClick={() => handleEditClick(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 text-slate-400 hover:text-red-600 p-0" onClick={() => handleDeleteClick(product)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {products.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-sm text-slate-500">
              <div>Showing page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        {isDeleteOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <Card className="w-full max-w-md shadow-xl border-none">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" aria-hidden="true" />
                </div>
                <h2 id="delete-dialog-title" className="text-xl font-bold text-slate-900 mb-2">Delete Product</h2>
                <p className="text-slate-500 mb-6">
                  Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleCloseModals}>Cancel</Button>
                  <Button variant="danger" onClick={handleConfirmDelete}>Delete Product</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {isFormOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm sm:items-start sm:pt-16 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-dialog-title"
          >
            <form onSubmit={handleFormSubmit} className="w-full max-w-2xl">
              <Card className="w-full shadow-xl border-none mb-16">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
                  <h2 id="form-dialog-title" className="text-xl font-bold text-slate-900">
                    {selectedProduct ? "Edit Product" : "Add New Product"}
                  </h2>
                  <Button type="button" variant="ghost" size="sm" onClick={handleCloseModals} className="text-slate-400 hover:text-slate-900">
                    ✕
                  </Button>
                </div>
                <div className="p-6 space-y-6 bg-slate-50">
                  {formError && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Product Image</label>
                      <div className="flex items-start gap-4">
                        {imagePreview ? (
                          <div className="relative w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-100 shrink-0">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              className="absolute top-1 right-1 bg-white/80 hover:bg-white text-slate-700 rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center shrink-0 text-slate-400">
                            <PackageSearch className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-[10px] uppercase font-semibold tracking-wider">No Image</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageChange}
                            className="bg-white cursor-pointer" 
                          />
                          <p className="text-xs text-slate-500 mt-2">
                            Upload a high-quality image of the product. Max size 2MB. 
                            Supported formats: JPG, PNG, WEBP.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Product Name *</label>
                      <Input 
                        required
                        placeholder="e.g., Premium Whole Wheat Bread" 
                        className="bg-white" 
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-slate-700">Description</label>
                      <textarea 
                        className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Detailed product description..."
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Barcode *</label>
                      <Input 
                        required
                        placeholder="Scan or enter barcode" 
                        className="bg-white font-mono" 
                        value={formData.barcode}
                        onChange={e => setFormData({...formData, barcode: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">SKU *</label>
                      <Input 
                        required
                        placeholder="Stock Keeping Unit" 
                        className="bg-white font-mono" 
                        value={formData.sku}
                        onChange={e => setFormData({...formData, sku: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Category *</label>
                      <Input 
                        list="category-options"
                        required
                        disabled={isCategoriesLoading || !!categoriesError}
                        placeholder={isCategoriesLoading ? "Loading..." : "Select or type category"}
                        className="bg-white" 
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                      />
                      <datalist id="category-options">
                        {categories.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                      {categoriesError && <p className="text-xs text-red-500">{categoriesError}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Price (₹) *</label>
                      <Input 
                        required
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        className="bg-white" 
                        value={formData.price}
                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">GST Percentage (%) *</label>
                      <Input 
                        required
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="0.00" 
                        className="bg-white" 
                        value={formData.gst_percentage}
                        onChange={e => setFormData({...formData, gst_percentage: parseFloat(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Initial Stock {selectedProduct ? "" : "*"}</label>
                      <Input 
                        required={!selectedProduct}
                        disabled={!!selectedProduct}
                        type="number" 
                        min="0"
                        placeholder="0" 
                        className="bg-white disabled:bg-slate-100" 
                        value={selectedProduct ? (selectedProduct.current_stock ?? 0) : formData.initial_stock}
                        onChange={e => {
                          if (!selectedProduct) {
                            setFormData({...formData, initial_stock: parseInt(e.target.value)})
                          }
                        }}
                      />
                      {selectedProduct && (
                        <p className="text-xs text-slate-500">Stock can only be modified via the Inventory module for existing products.</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Unit *</label>
                      <select 
                        required
                        className="w-full p-2.5 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.unit}
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                      >
                        <option value="PIECE">Piece</option>
                        <option value="KG">Kilogram (KG)</option>
                        <option value="GRAM">Gram</option>
                        <option value="LITRE">Litre</option>
                        <option value="ML">Millilitre</option>
                        <option value="PACK">Pack</option>
                      </select>
                    </div>

                    <div className="space-y-2 md:col-span-2 flex items-center pt-2">
                      <input 
                        type="checkbox" 
                        id="is_active" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        checked={formData.is_active}
                        onChange={e => setFormData({...formData, is_active: e.target.checked})}
                      />
                      <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">Product is Active (Visible to customers)</label>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3 rounded-b-xl sticky bottom-0 z-10">
                  <Button type="button" variant="outline" onClick={handleCloseModals}>Cancel</Button>
                  <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {selectedProduct ? "Save Changes" : "Create Product"}
                  </Button>
                </div>
              </Card>
            </form>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
