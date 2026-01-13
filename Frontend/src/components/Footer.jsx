import React from 'react';
import { Heart } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto py-8 text-center text-slate-500 text-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
                <span className="font-medium">TaxAssist AI</span>
                <span className="mx-2">&bull;</span>
                <span>&copy; {currentYear}</span>
            </div>
            <p className="flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                Made with <Heart size={14} className="text-red-500 fill-red-500 animate-pulse" /> in hackathon - HackQubit at RVCET
            </p>
        </footer>
    );
};

export default Footer;
