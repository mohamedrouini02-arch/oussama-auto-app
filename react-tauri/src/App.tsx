import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import InventoryDetails from './routes/inventory/InventoryDetails'
import InventoryEdit from './routes/inventory/InventoryEdit'
import InventoryList from './routes/inventory/InventoryList'
import InventoryNew from './routes/inventory/InventoryNew'
import ShippingDetails from './routes/shipping/ShippingDetails'
import ShippingEdit from './routes/shipping/ShippingEdit'
import ShippingList from './routes/shipping/ShippingList'
import ShippingNew from './routes/shipping/ShippingNew'

import OrdersDetails from './routes/orders/OrdersDetails'
import OrdersEdit from './routes/orders/OrdersEdit'
import OrdersList from './routes/orders/OrdersList'
import OrdersNew from './routes/orders/OrdersNew'

import Dashboard from './routes/Dashboard'
import FinanceDetails from './routes/finance/FinanceDetails'
import FinanceEdit from './routes/finance/FinanceEdit'
import FinanceList from './routes/finance/FinanceList'
import FinanceNew from './routes/finance/FinanceNew'
import Login from './routes/Login'
import Signup from './routes/Signup'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { session, loading } = useAuth()

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><div className="spinner"></div></div>
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

export default function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />

                        <Route path="/" element={
                            <ProtectedRoute>
                                <Layout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="orders">
                                <Route index element={<OrdersList />} />
                                <Route path="new" element={<OrdersNew />} />
                                <Route path=":id" element={<OrdersDetails />} />
                                <Route path=":id/edit" element={<OrdersEdit />} />
                            </Route>
                            <Route path="inventory">
                                <Route index element={<InventoryList />} />
                                <Route path="new" element={<InventoryNew />} />
                                <Route path=":id" element={<InventoryDetails />} />
                                <Route path=":id/edit" element={<InventoryEdit />} />
                            </Route>
                            <Route path="finance">
                                <Route index element={<FinanceList />} />
                                <Route path="new" element={<FinanceNew />} />
                                <Route path=":id" element={<FinanceDetails />} />
                                <Route path=":id/edit" element={<FinanceEdit />} />
                            </Route>
                            <Route path="shipping">
                                <Route index element={<ShippingList />} />
                                <Route path="new" element={<ShippingNew />} />
                                <Route path=":id" element={<ShippingDetails />} />
                                <Route path=":id/edit" element={<ShippingEdit />} />
                            </Route>
                        </Route>
                    </Routes>
                </BrowserRouter>
            </LanguageProvider>
        </AuthProvider>
    )
}
