"use client";

import * as React from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CustomerDashboardLayout } from "@/components/layout/CustomerDashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScanBarcode, ShoppingCart, Clock, QrCode, CreditCard, ChevronRight, PackageSearch, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cartService } from "@/lib/api/cart";
import { ordersService } from "@/lib/api/orders";
import { loyaltyService } from "@/lib/api/loyalty";
import { CartSummary, Order, LoyaltyBalance } from "@/types/dashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.name || "Customer";

  const [cart, setCart] = React.useState<CartSummary | null>(null);
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [loyalty, setLoyalty] = React.useState<LoyaltyBalance | null>(null);

  const [isCartLoading, setIsCartLoading] = React.useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = React.useState(true);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = React.useState(true);

  const [cartError, setCartError] = React.useState(false);
  const [ordersError, setOrdersError] = React.useState(false);
  const [loyaltyError, setLoyaltyError] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    const fetchDashboardData = async () => {
      // Cart
      try {
        const cartData = await cartService.getCart();
        if (mounted) setCart(cartData);
      } catch (err) {
        if (mounted) setCartError(true);
      } finally {
        if (mounted) setIsCartLoading(false);
      }

      // Orders
      try {
        const ordersData = await ordersService.getRecentOrders();
        if (mounted) setOrders(ordersData);
      } catch (err) {
        if (mounted) setOrdersError(true);
      } finally {
        if (mounted) setIsOrdersLoading(false);
      }

      // Loyalty
      try {
        const loyaltyData = await loyaltyService.getLoyaltyBalance();
        if (mounted) setLoyalty(loyaltyData);
      } catch (err) {
        if (mounted) setLoyaltyError(true);
      } finally {
        if (mounted) setIsLoyaltyLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const cartItemsCount = cart?.total_item_count || 0;
  const cartTotal = cart?.subtotal ? parseFloat(cart.subtotal) : 0;
  const recentOrders = orders?.slice(0, 3) || [];
  
  // Deriving exit status from the latest order (if it's paid, Exit QR is available)
  const latestOrder = orders && orders.length > 0 ? orders[0] : null;
  const isExitAvailable = latestOrder?.status === "PAID";

  return (
    <ProtectedRoute allowedRoles={["CUSTOMER"]}>
      <CustomerDashboardLayout>
        
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {userName}</h1>
          <p className="mt-2 text-slate-500">Shop faster with self checkout.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          <Link href="/customer/scan">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-primary-600 text-white cursor-pointer group h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <ScanBarcode className="h-8 w-8 mb-3 text-primary-100 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-lg">Scan Product</h3>
                <p className="text-xs text-primary-200 mt-1">Add items to cart</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/customer/cart">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <ShoppingCart className="h-8 w-8 mb-3 text-teal-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-900 text-lg">View Cart</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isCartLoading ? "Loading..." : cartError ? "Unavailable" : `${cartItemsCount} items pending`}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/customer/history">
            <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <Clock className="h-8 w-8 mb-3 text-amber-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-slate-900 text-lg">My Orders</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isOrdersLoading ? "Loading..." : ordersError ? "Unavailable" : `View receipts`}
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/customer/exit-qr">
            <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full ${isExitAvailable ? 'bg-amber-50 border-amber-200' : ''}`}>
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <QrCode className={`h-8 w-8 mb-3 group-hover:scale-110 transition-transform ${isExitAvailable ? 'text-amber-600' : 'text-slate-700'}`} />
                <h3 className="font-semibold text-slate-900 text-lg">Exit QR</h3>
                <p className={`text-xs mt-1 ${isExitAvailable ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                  {isExitAvailable ? 'Ready for scan' : 'No active checkout'}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Summary Statistics */}
        <div className="mb-8 grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Cart Items</CardTitle>
              <PackageSearch className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              {isCartLoading ? (
                <div className="h-8 w-12 bg-slate-200 animate-pulse rounded"></div>
              ) : cartError ? (
                <div className="flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Error</div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">{cartItemsCount}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Cart Total</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              {isCartLoading ? (
                <div className="h-8 w-20 bg-slate-200 animate-pulse rounded"></div>
              ) : cartError ? (
                <div className="flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Error</div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">₹{cartTotal.toLocaleString()}</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Loyalty Points</CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-amber-500"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
            </CardHeader>
            <CardContent>
              {isLoyaltyLoading ? (
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded"></div>
              ) : loyaltyError ? (
                <div className="flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Error</div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">{loyalty?.points || 0}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-slate-500">Total Orders</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              {isOrdersLoading ? (
                <div className="h-8 w-12 bg-slate-200 animate-pulse rounded"></div>
              ) : ordersError ? (
                <div className="flex items-center text-xs text-red-500"><AlertCircle className="h-3 w-3 mr-1" /> Error</div>
              ) : (
                <div className="text-2xl font-bold text-slate-900">{orders?.length || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Split Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* How it works */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">How Self Checkout Works</CardTitle>
              <p className="text-sm text-slate-500">Four simple steps to skip the queue.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">1</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Scan Barcode</h4>
                    <p className="text-xs text-slate-500">Use your phone to scan items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">2</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Add to Cart</h4>
                    <p className="text-xs text-slate-500">Verify price and quantity</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">3</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Pay Online</h4>
                    <p className="text-xs text-slate-500">Secure digital payment</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">4</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900">Scan Exit QR</h4>
                    <p className="text-xs text-slate-500">Show generated QR at security gate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders List */}
          <Card className="border-slate-200 shadow-sm flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-900">Recent Orders</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Your latest purchases</p>
              </div>
              {recentOrders.length > 0 && (
                <Link href="/history" className="text-primary-600 font-medium text-sm hidden sm:flex items-center hover:text-primary-700">
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isOrdersLoading ? (
                <div className="space-y-4">
                  <div className="h-16 bg-slate-100 animate-pulse rounded-lg w-full"></div>
                  <div className="h-16 bg-slate-100 animate-pulse rounded-lg w-full"></div>
                </div>
              ) : ordersError ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-red-500">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-sm">Failed to load recent orders.</p>
                </div>
              ) : recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{order.order_number}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-slate-900">₹{order.total_amount}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 sm:hidden">
                    <Link href="/history">
                      <Button variant="outline" className="w-full text-sm">View All Orders</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <ShoppingCart className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">No recent orders</h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                    You haven&apos;t made any purchases yet. Scan an item to get started!
                  </p>
                  <Link href="/scan" className="w-full">
                    <Button className="w-full bg-primary-600 hover:bg-primary-700">
                      Start Shopping
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </CustomerDashboardLayout>
    </ProtectedRoute>
  );
}
