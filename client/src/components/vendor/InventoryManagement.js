import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown, ChevronRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import axios from 'axios';

const InventoryManagement = ({ categories, onInventoryComplete, existingProducts = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuantity, setEditingQuantity] = useState({}); // Track which quantities are being edited
  const [pendingQuantityChanges, setPendingQuantityChanges] = useState({}); // Track unsaved changes
  const [editingVendorPrice, setEditingVendorPrice] = useState({});
  const [pendingVendorPriceChanges, setPendingVendorPriceChanges] = useState({});
  const [editingFloorPrice, setEditingFloorPrice] = useState({});
  const [pendingFloorPriceChanges, setPendingFloorPriceChanges] = useState({});
  const { updateInventory, addNewProducts, session, socket, language } = useSocket();
  const { t } = useTranslation();
  
  // Prevent multiple API calls
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);

  const isAddingToExistingSession = existingProducts.length > 0;

  // CRITICAL FIX: Use the correct API base URL
  const API_BASE_URL = 'http://localhost:5000';

  // Function to translate product names
  const translateProductName = (productName) => {
    const normalizedName = productName.toLowerCase().replace(/\s+/g, '');
    const translationKey = normalizedName;
    const translated = t(translationKey);
    // If translation key doesn't exist, return original name
    return translated === translationKey ? productName : translated;
  };

  useEffect(() => {
    // CRITICAL FIX: Only load products ONCE when component mounts
    // Prevent continuous API calls by checking if already loaded or loading
    if (!hasLoadedRef.current && !loadingRef.current && categories && categories.length > 0) {
      console.log('🔄 Loading products for the first time:', categories);
      loadProducts();
    } else if (hasLoadedRef.current) {
      console.log('✅ Products already loaded, skipping API call');
    }
  }, [categories]);

  const loadProducts = async () => {
    // Prevent multiple simultaneous calls
    if (loadingRef.current || hasLoadedRef.current) {
      console.log('⚠️ Load already in progress or completed, skipping');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      const allProducts = [];
      const location = 'Mumbai';
      
      console.log('🔄 Loading products for categories:', categories);
      
      for (const category of categories) {
        console.log(`📦 Fetching products for category: ${category}`);
        try {
          const response = await axios.get(`${API_BASE_URL}/api/products/${category}?location=${location}`);
          const categoryProducts = response.data;
          
          console.log(`✅ Loaded ${categoryProducts.length} products for ${category}:`, categoryProducts);
          
          const productsWithInventory = categoryProducts.map(product => {
            const existingProduct = existingProducts.find(ep => ep.name === product.name);
            if (existingProduct && isAddingToExistingSession) {
              return null;
            }
            
            return {
              ...product,
              vendorPrice: product.marketPrice,
              floorPrice: Math.floor(product.marketPrice * 0.8),
              quantity: 0,
              imageAttempt: 0 // Track which image URL we're trying
            };
          }).filter(Boolean);
          
          allProducts.push(...productsWithInventory);
        } catch (categoryError) {
          console.error(`❌ Failed to load ${category} products:`, categoryError);
          if (categoryError.response) {
            console.error('Response data:', categoryError.response.data);
            console.error('Response status:', categoryError.response.status);
          }
          throw new Error(`Failed to load ${category}: ${categoryError.response?.data?.error || categoryError.message}`);
        }
      }
      
      console.log(`✅ Total products loaded: ${allProducts.length}`);
      setProducts(allProducts);
      hasLoadedRef.current = true; // Mark as loaded
      
    } catch (error) {
      console.error('❌ Error loading products:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`${t('failedToLoadProducts')}: ${errorMessage}\n\n${t('pleaseCheckServer')}`);
      
      setProducts([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const updateProduct = (productId, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, [field]: value }
        : product
    ));
  };

  // Handle quantity save
  const handleQuantitySave = (productId) => {
    const newQuantity = parseFloat(pendingQuantityChanges[productId]) || 0;
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, quantity: parseFloat(newQuantity.toFixed(1)) }
        : p
    ));
    
    // Clear editing state
    setPendingQuantityChanges(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
    setEditingQuantity(prev => ({ ...prev, [productId]: false }));
    
    console.log(`✓ Quantity saved: ${newQuantity}kg for product ${productId}`);
  };

  // Handle quantity cancel
  const handleQuantityCancel = (productId) => {
    setPendingQuantityChanges(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
    setEditingQuantity(prev => ({ ...prev, [productId]: false }));
  };

  // Handle vendor price save
  const handleVendorPriceSave = (productId) => {
    const newPrice = parseFloat(pendingVendorPriceChanges[productId]) || 0;
    updateProduct(productId, 'vendorPrice', newPrice);
    
    setPendingVendorPriceChanges(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
    setEditingVendorPrice(prev => ({ ...prev, [productId]: false }));
    
    console.log(`✓ Vendor price saved: ₹${newPrice} for product ${productId}`);
  };

  // Handle floor price save
  const handleFloorPriceSave = (productId) => {
    const newPrice = parseFloat(pendingFloorPriceChanges[productId]) || 0;
    updateProduct(productId, 'floorPrice', newPrice);
    
    setPendingFloorPriceChanges(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
    setEditingFloorPrice(prev => ({ ...prev, [productId]: false }));
    
    console.log(`✓ Floor price saved: ₹${newPrice} for product ${productId}`);
  };

  const handleContinue = () => {
    const availableProducts = products.filter(p => p.quantity > 0);

    if (availableProducts.length === 0) {
      alert(t('pleaseAddQuantity'));
      return;
    }

    const floorPrices = {};
    availableProducts.forEach(p => {
      floorPrices[p.id] = p.floorPrice;
    });

    if (isAddingToExistingSession && socket && session?.id) {
      socket.emit('add-new-products', {
        sessionId: session.id,
        newProducts: availableProducts,
        newFloorPrices: floorPrices
      });
      
      console.log(`✓ Adding ${availableProducts.length} new products to existing session`);
    } else {
      updateInventory({
        products: availableProducts,
        floorPrices
      });
    }

    onInventoryComplete(availableProducts, isAddingToExistingSession);
  };

  // CRITICAL FIX: Proper image error handling with fallback progression
  const handleImageError = (e, productId, category) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Prevent infinite loop by tracking attempts
    if (product.imageAttempt >= 1) {
      console.error(`❌ All image attempts failed for ${product.name}`);
      return; // Stop trying after default.png fails
    }

    console.log(`⚠️ Image load failed for ${product.name}, trying default.png`);
    
    // Update the attempt counter
    setProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, imageAttempt: 1 }
        : p
    ));

    // Try the default image for this category
    e.target.src = `${API_BASE_URL}/static/${category}/default.png`;
  };

  // CRITICAL FIX: Get the correct initial image URL
  const getImageUrl = (product) => {
    // If we've already tried and failed, use default
    if (product.imageAttempt >= 1) {
      return `${API_BASE_URL}/static/${product.category}/default.png`;
    }
    
    // First attempt: try the product's specific image
    if (product.image) {
      // If the image already has a full URL, use it
      if (product.image.startsWith('http')) {
        return product.image;
      }
      // If it's a path, prepend the API base URL
      return `${API_BASE_URL}${product.image}`;
    }
    
    // Fallback: construct from category and name
    const imageName = product.name.toLowerCase().replace(/\s+/g, '-');
    return `${API_BASE_URL}/static/${product.category}/${imageName}.png`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bharat-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bharat-primary mx-auto mb-4"></div>
          <p className="text-bharat-muted">Loading products and market prices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bharat-background p-4">
      <div className="max-w-6xl mx-auto">
        <StepIndicator currentStep="inventory" role="vendor" />
        
        <div className="bg-white rounded-xl shadow-lg border border-bharat-border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <h2 className="text-3xl font-bold text-bharat-primary">
                {isAddingToExistingSession ? 'Add More Products' : t('inventory')}
              </h2>
              <SpeakButton 
                text={isAddingToExistingSession ? 'Add More Products' : t('inventory')} 
                language={language} 
                size="md"
              />
            </div>
            <p className="text-bharat-muted">
              {isAddingToExistingSession 
                ? 'Select additional products to add to your existing inventory'
                : 'Set up your product inventory with prices and stock quantities'
              }
            </p>
          </div>

          {/* Products Grid - Enhanced Layout */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-bharat-primary">
                Products & Pricing
              </h3>
              <div className="text-sm text-bharat-muted">
                {products.length} products loaded • Live AI pricing
              </div>
            </div>
            
            <div className="grid gap-4">
              {products.map((product) => {
                const imageUrl = getImageUrl(product);
                
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-bharat-border rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-6">
                      {/* FIXED: Product Image with proper error handling */}
                      <div className="w-24 h-24 bg-bharat-background rounded-xl flex-shrink-0 overflow-hidden border-2 border-bharat-border">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => handleImageError(e, product.id, product.category)}
                          loading="lazy"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        {/* Name & Category */}
                        <div className="md:col-span-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-bharat-primary text-lg">
                              {translateProductName(product.name)}
                            </h4>
                            <SpeakButton 
                              text={translateProductName(product.name)} 
                              language={language} 
                              size="sm"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-bharat-muted capitalize bg-bharat-background px-2 py-1 rounded">
                              {product.category}
                            </span>
                          </div>
                        </div>

                        {/* Market Price */}
                        <div>
                          <label className="block text-sm font-medium text-bharat-muted mb-1">
                            Market Price
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-bharat-primary">
                              ₹{product.marketPrice}
                            </span>
                            {product.trend === 'up' ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : product.trend === 'down' ? (
                              <TrendingDown className="w-4 h-4 text-red-600" />
                            ) : null}
                          </div>
                          {product.location && (
                            <p className="text-xs text-bharat-muted mt-1">
                              📍 {product.location}
                            </p>
                          )}
                        </div>

                        {/* Your Price */}
                        <div>
                          <label className="block text-sm font-medium text-bharat-muted mb-1">
                            Your Price
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={pendingVendorPriceChanges[product.id] !== undefined ? pendingVendorPriceChanges[product.id] : product.vendorPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const numValue = value === '' ? 0 : parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    setPendingVendorPriceChanges(prev => ({ ...prev, [product.id]: value }));
                                    setEditingVendorPrice(prev => ({ ...prev, [product.id]: true }));
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value) || 0;
                                setPendingVendorPriceChanges(prev => ({ ...prev, [product.id]: numValue.toString() }));
                              }}
                              className={`w-24 text-center border-2 rounded-lg py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                                pendingVendorPriceChanges[product.id] !== undefined 
                                  ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                                  : 'border-bharat-border text-bharat-primary'
                              }`}
                              placeholder="₹"
                            />
                            
                            <button
                              onClick={() => handleVendorPriceSave(product.id)}
                              className={`p-2 rounded-lg transition-colors shadow-sm ${
                                editingVendorPrice[product.id] && pendingVendorPriceChanges[product.id] !== undefined
                                  ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Save vendor price"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Floor Price */}
                        <div>
                          <label className="block text-sm font-medium text-bharat-muted mb-1">
                            Min Price
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={pendingFloorPriceChanges[product.id] !== undefined ? pendingFloorPriceChanges[product.id] : product.floorPrice}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const numValue = value === '' ? 0 : parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    setPendingFloorPriceChanges(prev => ({ ...prev, [product.id]: value }));
                                    setEditingFloorPrice(prev => ({ ...prev, [product.id]: true }));
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = e.target.value;
                                const numValue = parseFloat(value) || 0;
                                setPendingFloorPriceChanges(prev => ({ ...prev, [product.id]: numValue.toString() }));
                              }}
                              className={`w-24 text-center border-2 rounded-lg py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                                pendingFloorPriceChanges[product.id] !== undefined 
                                  ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                                  : 'border-bharat-border text-bharat-primary'
                              }`}
                              placeholder="₹"
                            />
                            
                            <button
                              onClick={() => handleFloorPriceSave(product.id)}
                              className={`p-2 rounded-lg transition-colors shadow-sm ${
                                editingFloorPrice[product.id] && pendingFloorPriceChanges[product.id] !== undefined
                                  ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Save floor price"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-bharat-muted mb-1">
                            Stock (kg)
                          </label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              value={pendingQuantityChanges[product.id] !== undefined ? pendingQuantityChanges[product.id] : product.quantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                // Browser-side validation: only allow numbers and decimal point
                                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                  const numValue = value === '' ? 0 : parseFloat(value);
                                  if (!isNaN(numValue) && numValue >= 0) {
                                    setPendingQuantityChanges(prev => ({ ...prev, [product.id]: value }));
                                    setEditingQuantity(prev => ({ ...prev, [product.id]: true }));
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                // Clean up the value on blur
                                const value = e.target.value;
                                const numValue = parseFloat(value) || 0;
                                setPendingQuantityChanges(prev => ({ ...prev, [product.id]: numValue.toString() }));
                              }}
                              className={`w-24 text-center border-2 rounded-lg py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent transition-colors ${
                                pendingQuantityChanges[product.id] !== undefined 
                                  ? 'border-orange-400 bg-orange-50 text-bharat-primary' 
                                  : 'border-bharat-border text-bharat-primary'
                              }`}
                              placeholder="0"
                            />
                            
                            <button
                              onClick={() => handleQuantitySave(product.id)}
                              className={`p-2 rounded-lg transition-colors shadow-sm ${
                                editingQuantity[product.id] && pendingQuantityChanges[product.id] !== undefined
                                  ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                              title="Save quantity"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-bharat-muted mb-1">
                            Status
                          </label>
                          <div className="text-center">
                            {product.quantity > 0 ? (
                              <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg border-2 border-green-200 h-12 flex flex-col justify-center">
                                <div className="font-semibold text-sm">{t('available')}</div>
                                <div className="text-xs">₹{product.vendorPrice}{t('perKg')}</div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg border-2 border-gray-200 h-12 flex flex-col justify-center">
                                <div className="font-semibold text-sm">{t('outOfStock')}</div>
                                <div className="text-xs">{t('addQuantity')}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-bharat-background rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-bharat-primary mb-2">Summary</h4>
            <p className="text-bharat-muted">
              Products with stock: {products.filter(p => p.quantity > 0).length} / {products.length}
            </p>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              disabled={products.filter(p => p.quantity > 0).length === 0}
              className={`
                flex items-center space-x-2 px-6 py-3 rounded-lg
                font-medium transition-all duration-200
                ${products.filter(p => p.quantity > 0).length > 0
                  ? 'bg-bharat-primary text-white hover:bg-opacity-90'
                  : 'bg-bharat-border text-bharat-muted cursor-not-allowed'
                }
              `}
            >
              <span>{t('continue')}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryManagement;