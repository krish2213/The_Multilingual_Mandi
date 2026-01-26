import { useState, useEffect } from 'react';
import { Plus, Minus, TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../contexts/SocketContext';
import StepIndicator from '../common/StepIndicator';
import SpeakButton from '../common/SpeakButton';
import axios from 'axios';

const InventoryManagement = ({ categories, onInventoryComplete }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { updateInventory, language } = useSocket();
  const { t } = useTranslation();

  useEffect(() => {
    loadProducts();
  }, [categories]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const allProducts = [];
      const location = 'Mumbai'; // Can be made dynamic later
      
      console.log('🔄 Loading products for categories:', categories);
      
      for (const category of categories) {
        console.log(`📦 Fetching products for category: ${category}`);
        try {
          const response = await axios.get(`http://localhost:5000/api/products/${category}?location=${location}`);
          const categoryProducts = response.data;
          
          console.log(`✅ Loaded ${categoryProducts.length} products for ${category}:`, categoryProducts);
          
          // Products now come with live AI-powered prices
          const productsWithInventory = categoryProducts.map(product => ({
            ...product,
            vendorPrice: product.marketPrice,
            floorPrice: Math.floor(product.marketPrice * 0.8), // 20% below market
            quantity: 0
          }));
          
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
    } catch (error) {
      console.error('❌ Error loading products:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      alert(`Failed to load products: ${errorMessage}\n\nPlease check:\n1. Server is running\n2. Gemini API keys are working\n3. Internet connection is stable`);
      
      // Set empty products array so UI doesn't break
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = (productId, field, value) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, [field]: value }
        : product
    ));
  };

  const handleQuantityChange = (productId, change) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, quantity: Math.max(0, product.quantity + change) }
        : product
    ));
  };

  const handleContinue = () => {
  const availableProducts = products.filter(p => p.quantity > 0);

  if (availableProducts.length === 0) {
    alert('Please add quantity for at least one product');
    return;
  }

  const floorPrices = {};
  availableProducts.forEach(p => {
    floorPrices[p.id] = p.floorPrice;
  });

  updateInventory({
    products: availableProducts,
    floorPrices
  });

  onInventoryComplete(availableProducts);
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
                {t('inventory')}
              </h2>
              <SpeakButton 
                text={t('inventory')} 
                language={language} 
                size="md"
              />
            </div>
            <p className="text-bharat-muted">
              Set prices and quantities for your products
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
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-bharat-border rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center space-x-6">
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-bharat-background rounded-xl flex-shrink-0 overflow-hidden border-2 border-bharat-border">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://via.placeholder.com/96x96/e2e8f0/64748b?text=${product.name.charAt(0)}`;
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                      {/* Name & Category */}
                      <div className="md:col-span-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-bharat-primary text-lg">
                            {product.name}
                          </h4>
                          <SpeakButton 
                            text={product.name} 
                            language={language} 
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-bharat-muted capitalize bg-bharat-background px-2 py-1 rounded">
                            {product.category}
                          </span>
                          {product.source && (
                            <span className={`text-xs px-2 py-1 rounded ${
                              product.source === 'AI_Live_Search' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {product.source === 'AI_Live_Search' ? 'Live AI' : product.source}
                            </span>
                          )}
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
                        <input
                          type="number"
                          value={product.vendorPrice}
                          onChange={(e) => updateProduct(product.id, 'vendorPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border-2 border-bharat-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent text-lg font-semibold"
                          min="0"
                          placeholder="₹"
                        />
                      </div>

                      {/* Floor Price */}
                      <div>
                        <label className="block text-sm font-medium text-bharat-muted mb-1">
                          Min Price
                        </label>
                        <input
                          type="number"
                          value={product.floorPrice}
                          onChange={(e) => updateProduct(product.id, 'floorPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-3 border-2 border-bharat-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bharat-primary focus:border-transparent text-lg font-semibold"
                          min="0"
                          placeholder="₹"
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm font-medium text-bharat-muted mb-1">
                          Stock (kg)
                        </label>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleQuantityChange(product.id, -1)}
                            className="w-10 h-10 rounded-full bg-bharat-border text-bharat-primary hover:bg-bharat-primary hover:text-white transition-colors flex items-center justify-center font-bold"
                          >
                            <Minus className="w-5 h-5" />
                          </button>
                          <span className="w-16 text-center font-bold text-xl text-bharat-primary">
                            {product.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(product.id, 1)}
                            className="w-10 h-10 rounded-full bg-bharat-primary text-white hover:bg-opacity-90 transition-colors flex items-center justify-center font-bold"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="text-center">
                        {product.quantity > 0 ? (
                          <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                            <div className="font-semibold">Available</div>
                            <div className="text-sm">₹{product.vendorPrice}/kg</div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg">
                            <div className="font-semibold">Out of Stock</div>
                            <div className="text-sm">Add quantity</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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