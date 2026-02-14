export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            car_inventory: {
                Row: {
                    id: string // uuid
                    reference_number: string
                    brand: string
                    model: string
                    year: number
                    vin: string | null
                    color: string | null
                    mileage: number | null
                    location: 'Korea' | 'China' | string
                    status: 'Available' | 'Reserved' | 'Sold' | 'In Transit' | string
                    purchase_price: number | null
                    selling_price: number | null
                    photos: string[] | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                    sold_at: string | null
                    margin: number | null
                    assigned_to_order: string | null
                    assigned_to_buyer: string | null
                    buyer_type: string | null
                    added_by: string | null
                }
                Insert: {
                    id?: string
                    reference_number: string
                    brand: string
                    model: string
                    year: number
                    vin?: string | null
                    color?: string | null
                    mileage?: number | null
                    location: string
                    status?: string
                    purchase_price?: number | null
                    selling_price?: number | null
                    photos?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                    sold_at?: string | null
                    margin?: number | null
                    assigned_to_order?: string | null
                    assigned_to_buyer?: string | null
                    buyer_type?: string | null
                    added_by?: string | null
                }
                Update: {
                    id?: string
                    reference_number?: string
                    brand?: string
                    model?: string
                    year?: number
                    vin?: string | null
                    color?: string | null
                    mileage?: number | null
                    location?: string
                    status?: string
                    purchase_price?: number | null
                    selling_price?: number | null
                    photos?: string[] | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                    sold_at?: string | null
                    margin?: number | null
                    assigned_to_order?: string | null
                    assigned_to_buyer?: string | null
                    buyer_type?: string | null
                    added_by?: string | null
                }
            }
            orders: {
                Row: {
                    id: number // bigint
                    reference_number: string
                    customer_name: string
                    customer_phone: string | null
                    customer_email: string | null
                    customer_wilaya: string | null
                    car_brand: string | null
                    car_model: string | null
                    car_budget: string | null
                    car_custom_budget: string | null
                    status: string
                    notes: string | null
                    order_data: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: number
                    reference_number: string
                    customer_name: string
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_wilaya?: string | null
                    car_brand?: string | null
                    car_model?: string | null
                    car_budget?: string | null
                    car_custom_budget?: string | null
                    status?: string
                    notes?: string | null
                    order_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: number
                    reference_number?: string
                    customer_name?: string
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_wilaya?: string | null
                    car_brand?: string | null
                    car_model?: string | null
                    car_budget?: string | null
                    car_custom_budget?: string | null
                    status?: string
                    notes?: string | null
                    order_data?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            financial_transactions: {
                Row: {
                    id: string
                    type: 'Income' | 'Expense' | string
                    category: string
                    description: string
                    amount: number
                    original_amount: number | null
                    currency: string | null
                    payment_method: string | null
                    payment_status: string | null
                    related_order_id: string | null
                    related_car_id: string | null
                    transaction_date: string
                    seller_name: string | null
                    buyer_name: string | null
                    seller_commission: number | null
                    buyer_commission: number | null
                    bureau_commission: number | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    type: string
                    category: string
                    description: string
                    amount: number
                    original_amount?: number | null
                    currency?: string | null
                    payment_method?: string | null
                    payment_status?: string | null
                    related_order_id?: string | null
                    related_car_id?: string | null
                    transaction_date?: string
                    seller_name?: string | null
                    buyer_name?: string | null
                    seller_commission?: number | null
                    buyer_commission?: number | null
                    bureau_commission?: number | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: string
                    category?: string
                    description?: string
                    amount?: number
                    original_amount?: number | null
                    currency?: string | null
                    payment_method?: string | null
                    payment_status?: string | null
                    related_order_id?: string | null
                    related_car_id?: string | null
                    transaction_date?: string
                    seller_name?: string | null
                    buyer_name?: string | null
                    seller_commission?: number | null
                    buyer_commission?: number | null
                    bureau_commission?: number | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            shipping_forms: {
                Row: {
                    id: number
                    created_at: string
                    customer_name: string | null
                    car_model: string | null
                    vin: string | null
                    status: string | null
                    pdf_url: string | null
                }
                Insert: {
                    id?: number
                    created_at?: string
                    customer_name?: string | null
                    car_model?: string | null
                    vin?: string | null
                    status?: string | null
                    pdf_url?: string | null
                }
                Update: {
                    id?: number
                    created_at?: string
                    customer_name?: string | null
                    car_model?: string | null
                    vin?: string | null
                    status?: string | null
                    pdf_url?: string | null
                }
            },
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    role: 'admin' | 'manager' | 'staff' | string
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    role?: string
                    created_at?: string
                    updated_at?: string | null
                }
            }
        }
    }
}
