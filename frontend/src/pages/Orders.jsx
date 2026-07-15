import React, { useState, useEffect } from 'react';
import { ClipboardList, Copy, Check, ShieldAlert, Package, Calendar, MapPin, CreditCard, ChevronRight } from 'lucide-react';
import api from '../services/api';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/mine?limit=20');
        setOrders(response.data.data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
        showToast('Failed to fetch your orders history.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleCopyId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    setCopiedId(orderId);
    showToast('Order ID copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will restore product stock levels.')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      // Dynamically update the status in local state
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                orderStatus: 'cancelled',
                items: o.items.map((i) => ({ ...i, itemStatus: 'cancelled' }))
              }
            : o
        )
      );
      showToast('Order cancelled successfully and stock levels restored!', 'success');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      showToast(err.response?.data?.message || 'Failed to cancel order.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'placed':
      case 'confirmed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getTimelineSteps = (orderStatus) => {
    const steps = ['placed', 'confirmed', 'shipped', 'delivered'];
    const currentIdx = steps.indexOf(orderStatus);
    if (orderStatus === 'cancelled') {
      return [
        { name: 'Order Placed', active: true, completed: true },
        { name: 'Cancelled', active: true, completed: true, error: true }
      ];
    }
    return steps.map((step, idx) => ({
      name: step.charAt(0).toUpperCase() + step.slice(1),
      active: idx <= currentIdx,
      completed: idx < currentIdx,
      current: idx === currentIdx
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-6">
        <Skeleton className="h-10 w-48 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-1/3 rounded-md" />
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            <hr className="border-slate-50" />
            <div className="flex gap-4">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <ClipboardList size={26} />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-900">Your Orders</h1>
          <p className="text-xs text-slate-400">Track shipments, manage order returns, and view receipts.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-6 max-w-xl mx-auto">
          <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-full">
            <Package size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-800">No Orders Found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              It looks like you haven't placed any orders yet. Visit our catalog to find premium selections.
            </p>
          </div>
          <Button variant="primary" onClick={() => window.location.href = '/catalog'}>
            Start Shopping
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const timelineSteps = getTimelineSteps(order.orderStatus);
            return (
              <div
                key={order._id}
                className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
              >
                {/* Order Header info bar */}
                <div className="bg-slate-50/70 border-b border-slate-100 p-5 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Date Placed</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Order ID</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-xs font-semibold text-slate-700">{order._id}</span>
                        <button
                          onClick={() => handleCopyId(order._id)}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Copy Order ID"
                        >
                          {copiedId === order._id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Total Amount</span>
                      <span className="font-bold text-slate-800 block mt-0.5">₹{order.grandTotal}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {['placed', 'confirmed'].includes(order.orderStatus) && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="px-3 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-100 rounded-full transition-colors cursor-pointer"
                      >
                        Cancel Order
                      </button>
                    )}
                    <span
                      className={`px-3 py-1 text-xs font-semibold border rounded-full capitalize select-none ${getStatusColor(order.orderStatus)}`}
                    >
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-6 space-y-6">
                  {/* Items List */}
                  <div className="divide-y divide-slate-100">
                    {order.items.map((item) => (
                      <div key={item._id} className="py-4 flex gap-4 first:pt-0 last:pb-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-800 text-sm truncate hover:text-indigo-600 cursor-pointer">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                            <span>Qty: <span className="font-semibold text-slate-700">{item.quantity}</span></span>
                            <span>•</span>
                            <span>Price: <span className="font-semibold text-slate-700">₹{item.price}</span></span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full capitalize select-none ${getStatusColor(item.itemStatus)}`}>
                            {item.itemStatus}
                          </span>
                          <span className="block text-sm font-bold text-slate-800 mt-2">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="border-slate-100" />

                  {/* Summary & Shipping details block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {/* Shipping Address */}
                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <MapPin size={14} />
                        <span>Shipping Address</span>
                      </div>
                      <div className="text-slate-700 leading-relaxed text-xs">
                        <p className="font-semibold text-slate-800">{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.street}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                        <p>{order.shippingAddress.country}</p>
                        <p className="mt-1.5 text-slate-500 font-mono text-[11px]">Phone: {order.shippingAddress.phone}</p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          <CreditCard size={14} />
                          <span>Payment Information</span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                          <span className="text-slate-400">Payment Status:</span>
                          <span className={`font-semibold capitalize ${order.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {order.paymentStatus}
                          </span>
                          <span className="text-slate-400">Method:</span>
                          <span className="font-semibold text-slate-700 capitalize">{order.paymentMethod}</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-xs">
                        <span className="text-slate-400">Applied Discount:</span>
                        <span className="font-bold text-slate-700">₹{order.discountTotal || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Timeline */}
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between gap-2 max-w-xl mx-auto">
                      {timelineSteps.map((step, idx) => (
                        <React.Fragment key={idx}>
                          {/* Step Bubble */}
                          <div className="flex flex-col items-center space-y-1.5 relative z-10">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs font-bold transition-all duration-300 ${
                                step.error
                                  ? 'bg-rose-50 border-rose-300 text-rose-600'
                                  : step.completed
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                  : step.current
                                  ? 'bg-indigo-50 border-indigo-500 text-indigo-600 ring-2 ring-indigo-100/50'
                                  : 'bg-white border-slate-200 text-slate-400'
                              }`}
                            >
                              {step.completed && !step.error ? <Check size={14} strokeWidth={3} /> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-semibold tracking-wide ${
                              step.error ? 'text-rose-600' : step.active ? 'text-slate-800' : 'text-slate-400'
                            }`}>
                              {step.name}
                            </span>
                          </div>

                          {/* Line Connector */}
                          {idx < timelineSteps.length - 1 && (
                            <div className="flex-1 h-0.5 bg-slate-100 mx-2 relative -translate-y-3">
                              <div
                                className={`absolute inset-0 transition-all duration-500 ${
                                  step.error
                                    ? 'bg-rose-400'
                                    : timelineSteps[idx + 1].active
                                    ? 'bg-indigo-500'
                                    : 'bg-slate-100'
                                }`}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
