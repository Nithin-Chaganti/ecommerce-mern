import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Heart, ShieldCheck, MapPin, Plus, ArrowRight, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import api from '../services/api';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { addToWishlist } = useWishlist();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountValue, discountType }
  const [couponError, setCouponError] = useState('');

  // Address Form State
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false
  });

  // Calculate pricing
  const subtotal = cart?.items?.reduce((sum, item) => {
    const price = item.product?.price || item.priceAtAddition || 0;
    return sum + (price * item.quantity);
  }, 0) || 0;

  // Shipping logic (e.g. free shipping over ₹999)
  const shippingFee = subtotal === 0 ? 0 : (subtotal > 999 ? 0 : 49);

  // Apply Coupon Logic
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    // We can simulate some standard coupons client-side for immediate visual response,
    // though backend validates it on checkout.
    if (code === 'APEX10') {
      setAppliedCoupon({ code, discountType: 'percentage', discountValue: 10 });
      showToast('Coupon APEX10 applied! (10% discount)', 'success');
    } else if (code === 'SAVE150') {
      if (subtotal < 1000) {
        setCouponError('Minimum order value for SAVE150 is ₹1,000');
        return;
      }
      setAppliedCoupon({ code, discountType: 'flat', discountValue: 150 });
      showToast('Coupon SAVE150 applied! (₹150 off)', 'success');
    } else {
      setCouponError('Invalid coupon code. Try "APEX10" or "SAVE150".');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const discountAmount = appliedCoupon
    ? (appliedCoupon.discountType === 'percentage' 
        ? Math.round((subtotal * appliedCoupon.discountValue) / 100) 
        : appliedCoupon.discountValue)
    : 0;

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  // Load user addresses when checkout opens
  useEffect(() => {
    if (isCheckoutOpen) {
      const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
          const response = await api.get('/address');
          const addrList = response.data.data || [];
          setAddresses(addrList);
          
          // Select default address if available
          const defaultAddr = addrList.find(a => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id);
          } else if (addrList.length > 0) {
            setSelectedAddressId(addrList[0]._id);
          }
        } catch (err) {
          console.error('Failed to load addresses:', err);
          showToast('Could not load shipping addresses', 'error');
        } finally {
          setLoadingAddresses(false);
        }
      };
      fetchAddresses();
    }
  }, [isCheckoutOpen, showToast]);

  const handleAddressChange = (e) => {
    const { id, value, type, checked } = e.target;
    setAddressForm(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAddressSubmit = async (e) => {
    e.preventDefault();
    
    // Quick validation
    const { fullName, phone, street, city, state, pincode } = addressForm;
    if (!fullName || !phone || !street || !city || !state || !pincode) {
      showToast('Please fill out all address fields', 'warning');
      return;
    }

    try {
      const response = await api.post('/address', addressForm);
      const newAddresses = response.data.data || [];
      setAddresses(newAddresses);
      
      // Select the newly added address
      // Find the one that was just added (it might be the last one)
      if (newAddresses.length > 0) {
        setSelectedAddressId(newAddresses[newAddresses.length - 1]._id);
      }

      setIsAddingAddress(false);
      setAddressForm({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India',
        isDefault: false
      });
      showToast('Address saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to add address:', err);
      showToast(err.response?.data?.message || 'Failed to save address', 'error');
    }
  };

  // Checkout Execution
  const handleCheckoutSubmit = async () => {
    const selectedAddress = addresses.find(a => a._id === selectedAddressId);
    if (!selectedAddress) {
      showToast('Please select a shipping address', 'warning');
      return;
    }

    setPlacingOrder(true);
    try {
      // Step 1: Create checkout order on backend
      const checkoutResponse = await api.post('/checkout/create-order', {
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          country: selectedAddress.country || 'India'
        },
        couponCode: appliedCoupon?.code || undefined
      });

      const { razorpayOrderId, amount, currency, keyId } = checkoutResponse.data.data;

      // Handle mock or real payment
      if (razorpayOrderId.startsWith('order_mock_')) {
        // SIMULATE PAYMENT PROCESS
        showToast('Simulating secure gateway connection...', 'info');
        
        setTimeout(async () => {
          try {
            // Call verify payment with mock values
            await api.post('/checkout/verify-payment', {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
              razorpay_signature: 'mock_sig_code_12345'
            });

            showToast('Order confirmed! Receipt sent to email.', 'success');
            setIsCheckoutOpen(false);
            
            // Redirect to profile or orders page
            navigate('/profile'); 
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            showToast('Payment simulation verification failed.', 'error');
          } finally {
            setPlacingOrder(false);
          }
        }, 1500);

      } else {
        // Launch real Razorpay SDK if checkout script is loaded
        if (window.Razorpay) {
          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'ApexMarket',
            description: 'Apex E-Commerce Payment',
            order_id: razorpayOrderId,
            handler: async function (response) {
              setPlacingOrder(true);
              try {
                await api.post('/checkout/verify-payment', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                showToast('Payment successful, order placed!', 'success');
                setIsCheckoutOpen(false);
                navigate('/profile');
              } catch (verifyErr) {
                console.error('Real payment verification failed:', verifyErr);
                showToast('Failed to verify payment', 'error');
              } finally {
                setPlacingOrder(false);
              }
            },
            prefill: {
              name: selectedAddress.fullName,
              contact: selectedAddress.phone
            },
            theme: {
              color: '#4f46e5'
            },
            modal: {
              ondismiss: function () {
                setPlacingOrder(false);
                showToast('Payment checkout cancelled', 'warning');
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // If script not loaded, try to load it dynamically
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => {
            handleCheckoutSubmit(); // Retry
          };
          document.body.appendChild(script);
          showToast('Loading secure checkout widgets...', 'info');
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast(err.response?.data?.message || 'Failed to initialize order checkout', 'error');
      setPlacingOrder(false);
    }
  };

  const handleMoveToWishlist = async (productId) => {
    const success = await addToWishlist(productId);
    if (success) {
      await removeFromCart(productId);
    }
  };

  // If cart is empty
  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6 font-sans">
        <div className="inline-flex items-center justify-center p-6 bg-indigo-50 text-indigo-600 rounded-full">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900">Your Cart is Empty</h1>
        <p className="text-slate-500 max-w-sm mx-auto">
          Explore our collection of handpicked premium products and fill your bag with deals.
        </p>
        <Link to="/catalog">
          <Button variant="primary" size="lg" icon={Plus}>
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 mb-8">My Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: Items List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {cart.items.map((item) => {
                const product = item.product;
                if (!product) return null;

                const price = product.price || item.priceAtAddition || 0;
                const totalItemPrice = price * item.quantity;
                const image = product.images && product.images.length > 0
                  ? product.images[0]
                  : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3';

                return (
                  <div key={product._id} className="p-5 flex gap-4 sm:gap-6 items-start">
                    
                    {/* Image */}
                    <Link to={`/product/${product._id}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-2">
                      <img src={image} alt={product.title} className="w-full h-full object-contain" />
                    </Link>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <Link to={`/product/${product._id}`} className="block">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">
                          {product.title}
                        </h3>
                      </Link>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Price: ₹{price.toLocaleString('en-IN')}
                      </p>

                      {/* Item Actions */}
                      <div className="flex items-center gap-4 pt-1 text-xs">
                        <button
                          onClick={() => handleMoveToWishlist(product._id)}
                          className="text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Heart size={14} />
                          <span className="hidden sm:inline">Move to Wishlist</span>
                        </button>
                        <button
                          onClick={() => removeFromCart(product._id)}
                          className="text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 font-semibold"
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>

                    {/* Quantity & Item Total */}
                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          onClick={() => updateQuantity(product._id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-slate-700 w-6 text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product._id, item.quantity + 1)}
                          className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold"
                          disabled={product.stock <= item.quantity}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900 font-display">
                        ₹{totalItemPrice.toLocaleString('en-IN')}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Clear Cart Button */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={clearCart}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
              >
                <Trash2 size={14} />
                <span>Clear Entire Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-slate-900 font-display">Order Summary</h3>

            {/* Price list */}
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Fee</span>
                <span className="font-semibold text-slate-800">
                  {shippingFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${shippingFee}`}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span className="font-bold text-emerald-600">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="border-t border-slate-100 pt-3.5 flex justify-between text-base font-extrabold text-slate-900 font-display">
                <span>Total Amount</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Coupon Application Block */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Promo Coupon</label>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-xs font-bold text-emerald-700">Code: {appliedCoupon.code} Applied</span>
                  <button onClick={handleRemoveCoupon} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (APEX10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                  <Button type="submit" variant="secondary" size="sm" className="py-2 text-xs font-bold rounded-xl">
                    Apply
                  </Button>
                </form>
              )}

              {couponError && (
                <p className="text-[11px] font-semibold text-rose-500 animate-fade-in">{couponError}</p>
              )}
            </div>

            {/* Checkout CTA */}
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md shadow-indigo-100/50 py-3 rounded-xl gap-2 mt-4"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={18} />
            </Button>

            {/* Security Notice */}
            <div className="flex justify-center items-center gap-1.5 text-[11px] text-slate-400 font-semibold pt-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Checkout security guaranteed</span>
            </div>
          </div>
        </div>

      </div>

      {/* Checkout Modal Overlay */}
      <Modal
        isOpen={isCheckoutOpen}
        onClose={() => { if (!placingOrder) setIsCheckoutOpen(false); }}
        title="Apex Secure Checkout"
        size="md"
      >
        <div className="space-y-6">
          
          {/* Checkout Steps */}
          <div className="space-y-4">
            
            {/* Step 1: Address Selection */}
            {!isAddingAddress ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
                    <MapPin size={16} className="text-indigo-600" />
                    <span>Select Shipping Address</span>
                  </h4>
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    <Plus size={14} />
                    <span>Add New</span>
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <p className="text-xs text-slate-500">You don't have any shipping addresses saved yet.</p>
                    <Button onClick={() => setIsAddingAddress(true)} variant="secondary" size="sm">
                      Create First Address
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {addresses.map((addr) => (
                      <label
                        key={addr._id}
                        onClick={() => setSelectedAddressId(addr._id)}
                        className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedAddressId === addr._id
                            ? 'border-indigo-600 bg-indigo-50/10 shadow-sm'
                            : 'border-slate-150 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressId === addr._id}
                          onChange={() => setSelectedAddressId(addr._id)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300"
                        />
                        <div className="flex-1 min-w-0 text-xs text-slate-600">
                          <p className="font-bold text-slate-800 text-sm mb-0.5">{addr.fullName}</p>
                          <p className="truncate">{addr.street}</p>
                          <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="font-semibold mt-1">Phone: {addr.phone}</p>
                          {addr.isDefault && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase tracking-wider rounded border border-indigo-100/50">
                              Default Address
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Add New Address Form */
              <form onSubmit={handleAddAddressSubmit} className="space-y-4 border border-slate-100 p-4 rounded-2xl bg-slate-50">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">New Shipping Address</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <Input
                    id="fullName"
                    label="Full Name"
                    placeholder="John Doe"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    className="col-span-2"
                  />
                  <Input
                    id="phone"
                    label="Phone Number"
                    placeholder="9876543210"
                    value={addressForm.phone}
                    onChange={handleAddressChange}
                  />
                  <Input
                    id="pincode"
                    label="Pincode"
                    placeholder="400001"
                    value={addressForm.pincode}
                    onChange={handleAddressChange}
                  />
                  <Input
                    id="street"
                    label="Street Address / Area"
                    placeholder="Flat 101, Bldg A, Main St"
                    value={addressForm.street}
                    onChange={handleAddressChange}
                    className="col-span-2"
                  />
                  <Input
                    id="city"
                    label="City"
                    placeholder="Mumbai"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                  />
                  <Input
                    id="state"
                    label="State"
                    placeholder="Maharashtra"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleAddressChange}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-350"
                  />
                  <label htmlFor="isDefault" className="text-xs font-semibold text-slate-600 select-none cursor-pointer">
                    Set as default address
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" size="sm" className="font-bold">
                    Save Address
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Payment info details */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-sm font-bold text-slate-800 font-display flex items-center gap-1.5">
                <CreditCard size={16} className="text-indigo-600" />
                <span>Payment Method</span>
              </h4>
              <div className="p-4 border border-indigo-100 bg-indigo-50/10 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-900">Razorpay Secure Checkout</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports UPI, NetBanking, Cards & Wallets</p>
                </div>
                <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded uppercase">
                  Active
                </span>
              </div>
            </div>

            {/* Totals Breakdown */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Coupon Discount</span>
                  <span className="text-emerald-600 font-bold">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-800 pt-1.5 border-t border-slate-150">
                <span>Amount to Pay</span>
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <Button
              onClick={() => setIsCheckoutOpen(false)}
              variant="secondary"
              disabled={placingOrder}
              className="font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckoutSubmit}
              variant="primary"
              loading={placingOrder}
              disabled={addresses.length === 0 || isAddingAddress}
              className="font-bold px-6 gap-1.5"
            >
              <CreditCard size={16} />
              <span>Pay & Place Order</span>
            </Button>
          </div>

        </div>
      </Modal>

    </div>
  );
};

export default Cart;

