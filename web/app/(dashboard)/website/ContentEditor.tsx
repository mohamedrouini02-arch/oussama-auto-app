'use client'

import { supabase } from '@/lib/supabase'
import { CheckCircle, Loader2, Mail, MapPin, Phone, Save, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ContentEditorProps {
    t: Record<string, any>
    dir: string
}

interface ContentSection {
    [key: string]: string
}

export default function ContentEditor({ t, dir }: ContentEditorProps) {
    const [hero, setHero] = useState<ContentSection>({})
    const [about, setAbout] = useState<ContentSection>({})
    const [contact, setContact] = useState<ContentSection>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [saved, setSaved] = useState<string | null>(null)

    useEffect(() => {
        fetchContent()
    }, [])

    async function fetchContent() {
        setLoading(true)
        try {
            const [heroRes, aboutRes, contactRes] = await Promise.all([
                supabase.from('website_content').select('content').eq('section', 'hero').single(),
                supabase.from('website_content').select('content').eq('section', 'about').single(),
                supabase.from('website_content').select('content').eq('section', 'contact').single(),
            ])
            if (heroRes.data) setHero(heroRes.data.content as ContentSection)
            if (aboutRes.data) setAbout(aboutRes.data.content as ContentSection)
            if (contactRes.data) setContact(contactRes.data.content as ContentSection)
        } catch (err) {
            console.error('Error fetching content:', err)
        } finally {
            setLoading(false)
        }
    }

    async function saveSection(section: string, content: ContentSection) {
        setSaving(section)
        try {
            const { error } = await supabase
                .from('website_content')
                .update({ content })
                .eq('section', section)
            if (error) throw error
            setSaved(section)
            setTimeout(() => setSaved(null), 3000)
        } catch (err) {
            console.error('Error saving content:', err)
        } finally {
            setSaving(null)
        }
    }

    const inputClass = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.heroSection}</h2>
                    </div>
                    <button
                        onClick={() => saveSection('hero', hero)}
                        disabled={saving === 'hero'}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {saving === 'hero' ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'hero' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved === 'hero' ? t.website.contentSaved : t.website.saveContent}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Badge (AR)</label>
                        <input className={inputClass} dir="rtl" value={hero.badge_ar || ''} onChange={e => setHero({ ...hero, badge_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Badge (FR)</label>
                        <input className={inputClass} value={hero.badge_fr || ''} onChange={e => setHero({ ...hero, badge_fr: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Title Line 1 (AR)</label>
                        <input className={inputClass} dir="rtl" value={hero.title1_ar || ''} onChange={e => setHero({ ...hero, title1_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Title Line 1 (FR)</label>
                        <input className={inputClass} value={hero.title1_fr || ''} onChange={e => setHero({ ...hero, title1_fr: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Highlighted Title (AR)</label>
                        <input className={inputClass} dir="rtl" value={hero.title2_ar || ''} onChange={e => setHero({ ...hero, title2_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Highlighted Title (FR)</label>
                        <input className={inputClass} value={hero.title2_fr || ''} onChange={e => setHero({ ...hero, title2_fr: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Subtitle (AR)</label>
                        <textarea className={inputClass} rows={3} dir="rtl" value={hero.subtitle_ar || ''} onChange={e => setHero({ ...hero, subtitle_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Subtitle (FR)</label>
                        <textarea className={inputClass} rows={3} value={hero.subtitle_fr || ''} onChange={e => setHero({ ...hero, subtitle_fr: e.target.value })} />
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.aboutSection}</h2>
                    </div>
                    <button
                        onClick={() => saveSection('about', about)}
                        disabled={saving === 'about'}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {saving === 'about' ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'about' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved === 'about' ? t.website.contentSaved : t.website.saveContent}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Our Story (AR)</label>
                        <textarea className={inputClass} rows={3} dir="rtl" value={about.story_ar || ''} onChange={e => setAbout({ ...about, story_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Our Story (FR)</label>
                        <textarea className={inputClass} rows={3} value={about.story_fr || ''} onChange={e => setAbout({ ...about, story_fr: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Mission (AR)</label>
                        <textarea className={inputClass} rows={2} dir="rtl" value={about.mission_ar || ''} onChange={e => setAbout({ ...about, mission_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Mission (FR)</label>
                        <textarea className={inputClass} rows={2} value={about.mission_fr || ''} onChange={e => setAbout({ ...about, mission_fr: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Vision (AR)</label>
                        <textarea className={inputClass} rows={2} dir="rtl" value={about.vision_ar || ''} onChange={e => setAbout({ ...about, vision_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>Vision (FR)</label>
                        <textarea className={inputClass} rows={2} value={about.vision_fr || ''} onChange={e => setAbout({ ...about, vision_fr: e.target.value })} />
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section className="bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700/50 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.website.contactInfo}</h2>
                    </div>
                    <button
                        onClick={() => saveSection('contact', contact)}
                        disabled={saving === 'contact'}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                    >
                        {saving === 'contact' ? <Loader2 className="w-4 h-4 animate-spin" /> : saved === 'contact' ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {saved === 'contact' ? t.website.contentSaved : t.website.saveContent}
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Phone</span>
                        </label>
                        <input className={inputClass} value={contact.phone || ''} onChange={e => setContact({ ...contact, phone: e.target.value })} placeholder="+213..." />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-green-500" /> WhatsApp</span>
                        </label>
                        <input className={inputClass} value={contact.whatsapp || ''} onChange={e => setContact({ ...contact, whatsapp: e.target.value })} placeholder="+82..." />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</span>
                        </label>
                        <input className={inputClass} value={contact.email || ''} onChange={e => setContact({ ...contact, email: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address (AR)</span>
                        </label>
                        <input className={inputClass} dir="rtl" value={contact.address_ar || ''} onChange={e => setContact({ ...contact, address_ar: e.target.value })} />
                    </div>
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Address (FR)</span>
                        </label>
                        <input className={inputClass} value={contact.address_fr || ''} onChange={e => setContact({ ...contact, address_fr: e.target.value })} />
                    </div>
                </div>
            </section>
        </div>
    )
}
