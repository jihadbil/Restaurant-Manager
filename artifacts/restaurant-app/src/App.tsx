import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Categories from "@/pages/categories";
import PaymentMethods from "@/pages/payment-methods";
import PrintStations from "@/pages/print-stations";
import Printers from "@/pages/printers";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import OrderNew from "@/pages/order-new";
import OrderDetail from "@/pages/order-detail";
import CategoryStations from "@/pages/category-stations";
import UsersPage from "@/pages/users";
import PosPage from "@/pages/pos";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <SidebarLayout>
      <Component />
    </SidebarLayout>
  );
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to="/" /> : <Register />}
      </Route>
      
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/pos" component={() => <ProtectedRoute component={PosPage} />} />
      <Route path="/orders" component={() => <ProtectedRoute component={Orders} />} />
      <Route path="/orders/new" component={() => <ProtectedRoute component={OrderNew} />} />
      <Route path="/orders/:id" component={() => <ProtectedRoute component={OrderDetail} />} />
      <Route path="/products" component={() => <ProtectedRoute component={Products} />} />
      <Route path="/categories" component={() => <ProtectedRoute component={Categories} />} />
      <Route path="/payment-methods" component={() => <ProtectedRoute component={PaymentMethods} />} />
      <Route path="/print-stations" component={() => <ProtectedRoute component={PrintStations} />} />
      <Route path="/printers" component={() => <ProtectedRoute component={Printers} />} />
      <Route path="/users" component={() => <ProtectedRoute component={UsersPage} />} />
      <Route path="/settings/category-stations" component={() => <ProtectedRoute component={CategoryStations} />} />
      
      <Route>
        {isAuthenticated ? (
          <SidebarLayout>
            <NotFound />
          </SidebarLayout>
        ) : (
          <NotFound />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
