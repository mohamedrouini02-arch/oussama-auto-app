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
            orders: {
                Row: {
                    id: number
                    reference_number: string
                    status: string | null
                    customer_name: string | null
                    customer_phone: string | null
                    customer_email: string | null
                    customer_wilaya: string | null
                    car_brand: string | null
                    car_model: string | null
                    car_budget: string | null
                    car_custom_budget: string | null
                    notes: string | null
                    source: string | null
                    created_at: string | null
                    updated_at: string | null
                    order_data: Json | null
                    added_by: string | null
                }
                Insert: {
                    id?: number
                    reference_number: string
                    status?: string | null
                    customer_name?: string | null
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_wilaya?: string | null
                    car_brand?: string | null
                    car_model?: string | null
                    car_budget?: string | null
                    car_custom_budget?: string | null
                    notes?: string | null
                    source?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    order_data?: Json | null
                    added_by?: string | null
                }
                Update: {
                    id?: number
                    reference_number?: string
                    status?: string | null
                    customer_name?: string | null
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_wilaya?: string | null
                    car_brand?: string | null
                    car_model?: string | null
                    car_budget?: string | null
                    car_custom_budget?: string | null
                    notes?: string | null
                    source?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    order_data?: Json | null
                    added_by?: string | null
                }
            }
            attendance_logs: {
                Row: {
                    id: string
                    employee_id: string
                    clock_in: string
                    clock_out: string | null
                    status: string | null
                    notes: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    employee_id: string
                    clock_in: string
                    clock_out?: string | null
                    status?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    employee_id?: string
                    clock_in?: string
                    clock_out?: string | null
                    status?: string | null
                    notes?: string | null
                    created_at?: string | null
                }
            }
            employees: {
                Row: {
                    id: string
                    full_name: string
                    role: string
                    status: string
                    hourly_rate: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    role?: string
                    status?: string
                    hourly_rate?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    role?: string
                    status?: string
                    hourly_rate?: number | null
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    role: string
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    role?: string
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    role?: string
                    created_at?: string
                    updated_at?: string | null
                }
            }
            documents: {
                Row: {
                    id: number
                    reference_number: string
                    customer_reference: string | null
                    document_type: string
                    document_data: Json | null
                    file_paths: string[] | null
                    upload_status: string | null
                    email_sent: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    reference_number: string
                    customer_reference?: string | null
                    document_type?: string
                    document_data?: Json | null
                    file_paths?: string[] | null
                    upload_status?: string | null
                    email_sent?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: number
                    reference_number?: string
                    customer_reference?: string | null
                    document_type?: string
                    document_data?: Json | null
                    file_paths?: string[] | null
                    upload_status?: string | null
                    email_sent?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            settings: {
                Row: {
                    id: string
                    key: string
                    value: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            shipping_forms: {
                Row: {
                    id: number
                    created_at: string | null
                    vehicle_model: string
                    vin_number: string
                    name: string
                    phone: string
                    email: string
                    address: string
                    passport_number: string
                    code_postal: string
                    zip_number: string
                    vehicle_photos_urls: string | null
                    pdf_url: string | null
                    status: string | null
                    notes: string | null
                    passport_photo_url: string | null
                    id_card_url: string | null
                    id_card_number: string | null
                    id_card_back_url: string | null
                    added_by: string | null
                }
                Insert: {
                    id?: number
                    created_at?: string | null
                    vehicle_model: string
                    vin_number: string
                    name: string
                    phone: string
                    email: string
                    address: string
                    passport_number: string
                    code_postal: string
                    zip_number: string
                    vehicle_photos_urls?: string | null
                    pdf_url?: string | null
                    status?: string | null
                    notes?: string | null
                    passport_photo_url?: string | null
                    id_card_url?: string | null
                    id_card_number?: string | null
                    id_card_back_url?: string | null
                    added_by?: string | null
                }
                Update: {
                    id?: number
                    created_at?: string | null
                    vehicle_model?: string
                    vin_number?: string
                    name?: string
                    phone?: string
                    email?: string
                    address?: string
                    passport_number?: string
                    code_postal?: string
                    zip_number?: string
                    vehicle_photos_urls?: string | null
                    pdf_url?: string | null
                    status?: string | null
                    notes?: string | null
                    passport_photo_url?: string | null
                    id_card_url?: string | null
                    id_card_number?: string | null
                    id_card_back_url?: string | null
                    added_by?: string | null
                }
            }
            car_inventory: {
                Row: {
                    id: string
                    brand: string
                    model: string
                    year: number
                    color: string | null
                    mileage: number | null
                    vin_number: string | null
                    purchase_price: number | null
                    selling_price: number | null
                    margin: number | null
                    currency: string | null
                    location: string
                    status: string | null
                    photos_urls: string[] | null
                    video_url: string | null
                    assigned_to_order: string | null
                    assigned_to_buyer: string | null
                    buyer_type: string | null
                    notes: string | null
                    added_by: string | null
                    created_at: string | null
                    updated_at: string | null
                    sold_at: string | null
                    photos: string[] | null
                    vin: string | null
                    buying_price_krw: number | null
                    added_by_name: string | null
                }
                Insert: {
                    id?: string
                    brand: string
                    model: string
                    year: number
                    color?: string | null
                    mileage?: number | null
                    vin_number?: string | null
                    purchase_price?: number | null
                    selling_price?: number | null
                    margin?: number | null
                    currency?: string | null
                    location: string
                    status?: string | null
                    photos_urls?: string[] | null
                    video_url?: string | null
                    assigned_to_order?: string | null
                    assigned_to_buyer?: string | null
                    buyer_type?: string | null
                    notes?: string | null
                    added_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    sold_at?: string | null
                    photos?: string[] | null
                    vin?: string | null
                    buying_price_krw?: number | null
                }
                Update: {
                    id?: string
                    brand?: string
                    model?: string
                    year?: number
                    color?: string | null
                    mileage?: number | null
                    vin_number?: string | null
                    purchase_price?: number | null
                    selling_price?: number | null
                    margin?: number | null
                    currency?: string | null
                    location?: string
                    status?: string | null
                    photos_urls?: string[] | null
                    video_url?: string | null
                    assigned_to_order?: string | null
                    assigned_to_buyer?: string | null
                    buyer_type?: string | null
                    notes?: string | null
                    added_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                    sold_at?: string | null
                    photos?: string[] | null
                    vin?: string | null
                    buying_price_krw?: number | null
                }
            }
            currency_exchange_rates: {
                Row: {
                    id: number
                    from_currency: string
                    to_currency: string
                    rate: number
                    source: string | null
                    notes: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    from_currency: string
                    to_currency: string
                    rate: number
                    source?: string | null
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: number
                    from_currency?: string
                    to_currency?: string
                    rate?: number
                    source?: string | null
                    notes?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            financial_summaries: {
                Row: {
                    id: number
                    period_type: string
                    period_start: string
                    period_end: string
                    total_income: number | null
                    total_expenses: number | null
                    net_profit: number | null
                    total_transactions: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: number
                    period_type: string
                    period_start: string
                    period_end: string
                    total_income?: number | null
                    total_expenses?: number | null
                    net_profit?: number | null
                    total_transactions?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: number
                    period_type?: string
                    period_start?: string
                    period_end?: string
                    total_income?: number | null
                    total_expenses?: number | null
                    net_profit?: number | null
                    total_transactions?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
            }
            financial_transactions: {
                Row: {
                    id: string
                    type: string
                    category: string
                    amount: number
                    original_amount: number | null
                    currency: string | null
                    description: string
                    payment_method: string | null
                    payment_status: string | null
                    paid_amount: number | null
                    related_order_id: string | null
                    related_order_number: string | null
                    related_car_id: string | null
                    transaction_date: string
                    seller_name: string | null
                    seller_commission: number | null
                    buyer_name: string | null
                    buyer_commission: number | null
                    bureau_commission: number | null

                    // Car Details
                    car_brand: string | null
                    car_model: string | null
                    car_year: number | null
                    car_vin: string | null
                    car_milage: number | null
                    car_buying_price: number | null

                    // Currency Exchange
                    buying_currency: string | null
                    original_buying_price: number | null
                    exchange_rate_dzd_usdt: number | null
                    exchange_rate_usdt_krw: number | null
                    is_paid_in_korea: boolean | null
                    paid_in_korea_date: string | null

                    // Customer
                    customer_name: string | null
                    customer_phone: string | null
                    customer_email: string | null
                    customer_postal_code: string | null
                    customer_address: string | null
                    shipping_price: number | null

                    created_at: string
                    updated_at: string | null
                    added_by: string | null
                }
                Insert: {
                    id?: string
                    type: string
                    category: string
                    amount: number
                    original_amount?: number | null
                    currency?: string | null
                    description: string
                    payment_method?: string | null
                    payment_status?: string | null
                    paid_amount?: number | null
                    related_order_id?: string | null
                    related_order_number?: string | null
                    related_car_id?: string | null
                    transaction_date?: string
                    seller_name?: string | null
                    seller_commission?: number | null
                    buyer_name?: string | null
                    buyer_commission?: number | null
                    bureau_commission?: number | null

                    car_brand?: string | null
                    car_model?: string | null
                    car_year?: number | null
                    car_vin?: string | null
                    car_milage?: number | null
                    car_buying_price?: number | null

                    buying_currency?: string | null
                    original_buying_price?: number | null
                    exchange_rate_dzd_usdt?: number | null
                    exchange_rate_usdt_krw?: number | null
                    is_paid_in_korea?: boolean | null
                    paid_in_korea_date?: string | null

                    customer_name?: string | null
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_postal_code?: string | null
                    customer_address?: string | null

                    created_at?: string
                    updated_at?: string | null
                    added_by?: string | null
                }
                Update: {
                    id?: string
                    type?: string
                    category?: string
                    amount?: number
                    original_amount?: number | null
                    currency?: string | null
                    description?: string
                    payment_method?: string | null
                    payment_status?: string | null
                    paid_amount?: number | null
                    related_order_id?: string | null
                    related_order_number?: string | null
                    related_car_id?: string | null
                    transaction_date?: string
                    seller_name?: string | null
                    seller_commission?: number | null
                    buyer_name?: string | null
                    buyer_commission?: number | null
                    bureau_commission?: number | null

                    car_brand?: string | null
                    car_model?: string | null
                    car_year?: number | null
                    car_vin?: string | null
                    car_milage?: number | null
                    car_buying_price?: number | null

                    buying_currency?: string | null
                    original_buying_price?: number | null
                    exchange_rate_dzd_usdt?: number | null
                    exchange_rate_usdt_krw?: number | null
                    is_paid_in_korea?: boolean | null
                    paid_in_korea_date?: string | null

                    customer_name?: string | null
                    customer_phone?: string | null
                    customer_email?: string | null
                    customer_postal_code?: string | null
                    customer_address?: string | null

                    created_at?: string
                    updated_at?: string | null
                    added_by?: string | null
                }
            }
        }
    }
}
