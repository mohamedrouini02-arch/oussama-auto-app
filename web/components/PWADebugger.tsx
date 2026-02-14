'use client';

import { useEffect, useState } from 'react';

export default function PWADebugger() {
    const [status, setStatus] = useState<string>('Checking...');
    const [isSecure, setIsSecure] = useState<boolean>(false);
    const [hasSW, setHasSW] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Check security context
        setIsSecure(window.isSecureContext);

        // Check SW support
        const swSupported = 'serviceWorker' in navigator;
        setHasSW(swSupported);

        if (swSupported) {
            navigator.serviceWorker.getRegistration().then(reg => {
                setStatus(reg ? `Active (Scope: ${reg.scope})` : 'Not Registered');
            }).catch(err => {
                setStatus(`Error: ${err.message}`);
            });
        } else {
            setStatus('Not Supported in this browser');
        }
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-xs z-50 shadow-xl border border-gray-700">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-yellow-400">PWA Debugger</h3>
                <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span>Secure (HTTPS):</span>
                    <span>{isSecure ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>SW Support:</span>
                    <span>{hasSW ? '✅ Yes' : '❌ No'}</span>
                </div>
                <div className="border-t border-gray-700 pt-1 mt-1">
                    <span className="block text-gray-400 mb-1">Status:</span>
                    <span className="font-mono text-green-300 break-all">{status}</span>
                </div>
            </div>
            {!isSecure && (
                <div className="mt-2 p-2 bg-red-900/50 rounded text-red-200 border border-red-800">
                    ⚠️ PWA requires HTTPS. If testing on phone, use a tunnel (ngrok) or localhost port forwarding.
                </div>
            )}
        </div>
    );
}
