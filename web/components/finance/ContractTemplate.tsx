'use client'

import { format } from 'date-fns'

interface ContractTemplateProps {
    transaction: any
    order?: any
    car?: any
}

export default function ContractTemplate({ transaction, order }: ContractTemplateProps) {
    if (!transaction) return null

    // Client Details
    const customerName = transaction.customer_name || order?.customer_name || 'قنون رشيد'
    const customerIdCard = transaction.customer_id_card || transaction.passport_number || '416212476'
    const customerAddress = transaction.customer_address || order?.customer_wilaya || 'الطاهير – جيجـــــــل'
    const customerPhone = transaction.customer_phone || order?.customer_phone || '0781782036'
    const customerPostalCode = transaction.customer_postal_code || '18002'
    const customerEmail = transaction.customer_email || ''

    // Dates
    const rawDate = transaction.transaction_date ? new Date(transaction.transaction_date) : new Date()
    const formattedDate = format(rawDate, 'dd/MM/yyyy')

    return (
        <div className="relative mx-auto bg-white text-black font-sans shadow-lg print:shadow-none box-border dir-rtl" dir="rtl" id="legal-contract">
            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 12mm 15mm;
                    }
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #legal-contract, #legal-contract * {
                        visibility: visible;
                    }
                    #legal-contract {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    .contract-page {
                        page-break-after: always !important;
                        break-after: page !important;
                        min-height: 275mm !important;
                        height: 275mm !important;
                        box-sizing: border-box !important;
                    }
                    .contract-page:last-child {
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }
                }
            `}</style>

            {/* ================= PAGE 1 ================= */}
            <div className="contract-page relative w-[210mm] min-h-[297mm] p-12 mx-auto border-b border-gray-200 print:border-none bg-white flex flex-col justify-between">
                <div>
                    {/* Header Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-black px-6 py-2 rounded-sm border-2 border-red-600 flex items-center justify-center">
                            <span className="text-2xl font-black text-red-600 tracking-wider">OUSSAMA</span>
                            <span className="text-2xl font-black text-yellow-400 tracking-wider">AUTO</span>
                        </div>
                    </div>

                    {/* Contract Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-xl md:text-2xl font-bold leading-relaxed text-gray-900 border-b-2 border-gray-900 pb-2 inline-block">
                            عقد خدمات استشارية وإدارية لاستيراد سيارات أقل من 3 سنوات
                            <br />
                            من كوريا الجنوبية و الصين
                        </h1>
                    </div>

                    {/* Preamble */}
                    <p className="text-sm leading-relaxed text-justify mb-8 text-gray-800" contentEditable suppressContentEditableWarning>
                        حرصًا من الطرفين على تنظيم العلاقة المهنية بينهما بشكل قانوني وشفاف، وبناءً على طلب العميل في الاستفادة من خدمات استشارية وإدارية تتعلق بعملية استيراد سيارة من كوريا الجنوبية و الصين، فقد تم إبرام هذا العقد بين كل من مزود الخدمة والعميل، وفقًا للشروط والأحكام المبينة أدناه، والتي يلتزم الطرفان باحترامها وتنفيذها بحسن نية.
                    </p>

                    {/* Parties Details */}
                    <div className="space-y-6 text-sm">
                        {/* Service Provider */}
                        <div className="border border-gray-300 rounded-lg p-5 bg-gray-50/50">
                            <h2 className="font-bold text-base text-gray-900 mb-3 border-b border-gray-200 pb-1">
                                مزود الخدمة:
                            </h2>
                            <div className="space-y-2 text-gray-800 leading-normal">
                                <p><strong className="font-bold">الاسم الكامل :</strong> بولمناخر أسامة ممثلا عنه بولمناخر معتصم بالله</p>
                                <p><strong className="font-bold">الصفة :</strong> مسؤول تسيير عقود الصفقات</p>
                                <p><strong className="font-bold">النشاط :</strong> تقديم خدمات استشارية وإدارية متعلقة باستيراد السيارات الأقل من ثلاث سنوات من كوريا الجنوبية و الصين</p>
                                <p><strong className="font-bold">العنوان :</strong> الشارع الكبير الميلية جيجل</p>
                                <p dir="ltr" className="text-right font-mono"><strong className="font-bold dir-rtl">رقم الهاتف:</strong> +82 1068737079 / +213 782769427</p>
                                <p><strong className="font-bold">البريد الالكتروني :</strong> oussamaboulemnakher@gmail.com</p>
                            </div>
                        </div>

                        {/* Client Details */}
                        <div className="border border-gray-300 rounded-lg p-5 bg-gray-50/50">
                            <h2 className="font-bold text-base text-gray-900 mb-3 border-b border-gray-200 pb-1">
                                العميل:
                            </h2>
                            <div className="space-y-2 text-gray-800 leading-normal">
                                <p>
                                    <strong className="font-bold">الاسم :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning className="font-bold">{customerName}</span>
                                </p>
                                <p>
                                    <strong className="font-bold">رقم بطاقة التعريف / NIN :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning className="font-mono">{customerIdCard}</span>
                                </p>
                                <p>
                                    <strong className="font-bold">العنوان :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning>{customerAddress}</span>
                                </p>
                                <p>
                                    <strong className="font-bold">رقم الهاتف :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning className="font-mono">{customerPhone}</span>
                                </p>
                                <p>
                                    <strong className="font-bold">الرمز البريدي :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning className="font-mono">{customerPostalCode}</span>
                                </p>
                                <p>
                                    <strong className="font-bold">البريد الالكتروني :</strong>{' '}
                                    <span contentEditable suppressContentEditableWarning>{customerEmail || '—'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-left text-xs text-gray-400 pt-4 border-t border-gray-100">
                    الصفحة 1 من 4
                </div>
            </div>

            {/* ================= PAGE 2 ================= */}
            <div className="contract-page relative w-[210mm] min-h-[297mm] p-12 mx-auto border-b border-gray-200 print:border-none bg-white flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-6 font-mono">
                        <span>04/01</span>
                        <span>عقد خدمات استشارية وإدارية</span>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed text-justify text-gray-900">
                        {/* Article 1 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 01: موضوع العقد</h3>
                            <p contentEditable suppressContentEditableWarning>
                                يُكلف "العميل" بموجب هذا العقد "مزود الخدمة" للقيام بتقديم خدمات استشارية وإدارية تتعلق بإجراءات استيراد سيارة (أقل من ثلاث سنوات) من كوريا الجنوبية و الصين، وذلك وفقًا للشروط المفصلة أدناه.
                            </p>
                        </div>

                        {/* Article 2 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 02: الخدمات المقدمة:</h3>
                            <div className="space-y-1.5 pr-2" contentEditable suppressContentEditableWarning>
                                <p>- تقديم استشارة أولية حول شروط وإجراءات الاستيراد.</p>
                                <p>- البحث عن عروض مناسبة وفق مواصفات العميل.</p>
                                <p>- التحقق من الوثائق التقنية والتجارية الخاصة بالمركبة.</p>
                                <p>- تقديم تقدير شامل للتكاليف (سعر السيارة، الشحن، إلخ).</p>
                                <p>- الاتفاق مع المورد الكوري أو الصيني وشراء السيارة باسم العميل (ثمن السيارة + مصاريف الشحن).</p>
                                <p>- تنسيق عملية الشحن إلى أحد الموانئ الجزائرية (حسب الاتفاق) إلى غاية وصول السيارة.</p>
                                <p>- تزويد العميل بكافة الوثائق اللازمة لاستلام السيارة واستكمال إجراءات الجمركة.</p>
                            </div>
                            <div className="mt-3 p-3 bg-gray-100 rounded-md border-r-4 border-gray-800 text-xs font-semibold" contentEditable suppressContentEditableWarning>
                                ملاحظة: تقتصر خدمات مزود الخدمة على إيصال السيارة إلى أحد الموانئ في الجزائر، وتبقى جميع الإجراءات الجمركية وتكاليفها تحت مسؤولية العميل.
                            </div>
                        </div>

                        {/* Article 3 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 03: أتعاب الخدمة:</h3>
                            <div contentEditable suppressContentEditableWarning>
                                <p>تم الاتفاق على أن أتعاب مزود الخدمة مقابل تنفيذ المهام أعلاه هي:</p>
                                <p className="font-bold my-1 text-base">خمسون ألف دينار جزائري (50,000 دج).</p>
                                <p>وتُدفع على النحو التالي:</p>
                                <p className="pr-3 font-semibold">• 50.000 دج (100%) عند توقيع العقد</p>
                            </div>
                        </div>

                        {/* Article 4 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 04: مدة التنفيذ:</h3>
                            <p contentEditable suppressContentEditableWarning>
                                يبدأ هذا العقد من تاريخ توقيعه من قبل الطرفين، ويظل ساري المفعول إلى حين إتمام الخدمات موضوع العقد أو بإنهائه من قبل أحد الطرفين وفقًا للشروط المحددة أدناه.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-left text-xs text-gray-400 pt-4 border-t border-gray-100">
                    الصفحة 2 من 4
                </div>
            </div>

            {/* ================= PAGE 3 ================= */}
            <div className="contract-page relative w-[210mm] min-h-[297mm] p-12 mx-auto border-b border-gray-200 print:border-none bg-white flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-6 font-mono">
                        <span>04/02</span>
                        <span>عقد خدمات استشارية وإدارية</span>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed text-justify text-gray-900">
                        {/* Article 5 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 05: المسؤوليات:</h3>
                            <div className="space-y-2 text-xs md:text-sm" contentEditable suppressContentEditableWarning>
                                <p className="font-bold">• يتعهد مزود الخدمة بما يلي:</p>
                                <p className="pr-4">- فحص السيارة قبل شرائها من خلال زيارة ميدانية أو عن طريق وكيل موثوق.</p>
                                <p className="pr-4">- إخضاع السيارة لفحص تقني لدى الشركة المصنعة أو مركز معتمد لضمان سلامتها الميكانيكية والتقنية.</p>
                                <p className="pr-4">- تقديم تقرير مفصل عن حالة السيارة للعميل قبل الشراء، يشمل حالة المحرك، عدد الكيلومترات، الهيكل الخارجي، والتجهيزات.</p>

                                <p className="font-bold pt-2">• رغم ذلك، لا يتحمل مزود الخدمة أي مسؤولية عن:</p>
                                <p className="pr-4">- الأعطال أو العيوب التي قد تظهر لاحقًا بعد الشحن أو عند الاستعمال، والتي لم يكن بالإمكان كشفها أثناء الفحص.</p>
                                <p className="pr-4">- تأخيرات أو عراقيل ناتجة عن أطراف خارجية (موردون، شركات شحن، الجمارك...).</p>

                                <p className="font-bold pt-2">• يلتزم العميل بما يلي:</p>
                                <p className="pr-4">- توفير معلومات دقيقة ومحدثة.</p>
                                <p className="pr-4">- تسديد تكاليف شراء السيارة والشحن في الآجال المتفق عليها.</p>
                                <p className="pr-4">- متابعة جميع الإجراءات الجمركية وتحمل الرسوم المتعلقة بها بعد وصول السيارة.</p>
                            </div>
                        </div>

                        {/* Article 6 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 06: القوة القاهرة:</h3>
                            <p contentEditable suppressContentEditableWarning>
                                في حال وقوع أحداث استثنائية خارجة عن الإرادة (كالحروب، الكوارث الطبيعية، الأزمات الصحية، قرارات حكومية مفاجئة...) تؤدي إلى تعذر تنفيذ العقد كليًا أو جزئيًا، يتم تعليق الالتزامات التعاقدية دون تحمل أي طرف للمسؤولية، إلى حين زوال تلك الظروف.
                            </p>
                        </div>

                        {/* Article 7 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 07: فسخ العقد:</h3>
                            <div className="space-y-1.5" contentEditable suppressContentEditableWarning>
                                <p>يجوز لأي طرف فسخ هذا العقد بإشعار كتابي للطرف الآخر قبل 7 أيام على الأقل، مع احترام ما يلي:</p>
                                <p className="pr-3">• يحتفظ مزود الخدمة بحقه في المطالبة بأتعابه عن الأعمال المنجزة قبل الفسخ.</p>
                                <p className="pr-3 font-semibold">• في حالة فسخ العقد لا يمكن استرداد مبلغ المقدم (العربون) الذي تم دفعه لحجز السيارة.</p>
                                <p className="pr-3">• في حال إخلال أحد الطرفين بالتزاماته، يحق للطرف الآخر إنهاء العقد دون إشعار إذا لم يتم تصحيح الوضع خلال 7 أيام من تاريخ التبليغ.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-left text-xs text-gray-400 pt-4 border-t border-gray-100">
                    الصفحة 3 من 4
                </div>
            </div>

            {/* ================= PAGE 4 ================= */}
            <div className="contract-page relative w-[210mm] min-h-[297mm] p-12 mx-auto bg-white flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mb-6 font-mono">
                        <span>04/03</span>
                        <span>عقد خدمات استشارية وإدارية</span>
                    </div>

                    <div className="space-y-6 text-sm leading-relaxed text-justify text-gray-900">
                        {/* Article 8 */}
                        <div>
                            <h3 className="font-bold text-base mb-2 underline">المادة 08: تسوية النزاعات</h3>
                            <p contentEditable suppressContentEditableWarning>
                                في حال نشوء أي نزاع يتعلق بتفسير أو تنفيذ هذا العقد، يسعى الطرفان لحله وديًا. وإن تعذر ذلك، يُحال النزاع إلى الجهة القضائية المختصة بمحكمة الميلية / جيجل.
                            </p>
                        </div>

                        {/* Additional Terms Block */}
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                            <h4 className="font-bold text-xs text-gray-700 mb-1">شروط وملاحظات إضافية (Conditions Supplémentaires) :</h4>
                            <div 
                                className="min-h-[60px] text-xs text-gray-800 leading-normal" 
                                contentEditable 
                                suppressContentEditableWarning
                            >
                                يقر الطرفان بموافقتهما التامة على كافة البنود الواردة أعلاه بدون أي تحفظ.
                            </div>
                        </div>

                        {/* Signing statement */}
                        <div className="pt-4">
                            <p className="font-bold text-base">
                                حرر هذا العقد بالميلية ، بتاريخ{' '}
                                <span contentEditable suppressContentEditableWarning className="underline">{formattedDate}</span>
                            </p>
                        </div>

                        {/* Signatures Area */}
                        <div className="pt-8">
                            <h4 className="font-bold text-base mb-6 underline">الإمضاءات:</h4>
                            <div className="grid grid-cols-2 gap-12 text-sm">
                                {/* Service Provider */}
                                <div className="space-y-12">
                                    <div>
                                        <span className="font-bold text-gray-900">مزود الخدمة:</span>
                                        <p className="mt-1 font-semibold text-gray-800">الاسم: بولمناخر معتصم بالله</p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-700">الإمضاء والختم:</span>
                                        <div className="mt-4 w-48 border-b-2 border-gray-400 border-dotted h-16"></div>
                                    </div>
                                </div>

                                {/* Client */}
                                <div className="space-y-12">
                                    <div>
                                        <span className="font-bold text-gray-900">العميل:</span>
                                        <p className="mt-1 font-semibold text-gray-800" contentEditable suppressContentEditableWarning>
                                            الاسم: {customerName}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-700">الإمضاء:</span>
                                        <div className="mt-4 w-48 border-b-2 border-gray-400 border-dotted h-16"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gratitude footer */}
                        <div className="text-center pt-12 pb-4">
                            <h3 className="text-2xl font-bold text-red-600 tracking-wider">
                                نشكركم على ثقتكم
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="text-left text-xs text-gray-400 pt-4 border-t border-gray-100">
                    الصفحة 4 من 4
                </div>
            </div>
        </div>
    )
}
