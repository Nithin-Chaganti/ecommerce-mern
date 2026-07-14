import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Mail, ShieldCheck } from 'lucide-react';

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const GithubIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 font-sans border-t border-slate-800">
      {/* Main Links Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 text-white font-display font-bold text-xl hover:text-indigo-400 transition-colors">
              <ShoppingBag className="text-indigo-500" size={24} />
              <span>ApexMarket</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Experience the pinnacle of online shopping. A premium multi-vendor ecosystem delivering quality products directly from trusted sellers to your doorstep.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-white transition-colors" aria-label="Facebook"><FacebookIcon size={18} /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Twitter"><TwitterIcon size={18} /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Instagram"><InstagramIcon size={18} /></a>
              <a href="#" className="hover:text-white transition-colors" aria-label="Github"><GithubIcon size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-display">Shop Catalog</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/catalog?category=electronics" className="hover:text-indigo-400 transition-colors">Electronics</Link></li>
              <li><Link to="/catalog?category=fashion" className="hover:text-indigo-400 transition-colors">Fashion & Apparel</Link></li>
              <li><Link to="/catalog?category=home" className="hover:text-indigo-400 transition-colors">Home & Living</Link></li>
              <li><Link to="/catalog?category=books" className="hover:text-indigo-400 transition-colors">Books & Media</Link></li>
            </ul>
          </div>

          {/* Vendor Area */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-display">Seller Hub</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register?role=seller" className="hover:text-indigo-400 transition-colors">Become a Seller</Link></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Seller Dashboard</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Vendor Guidelines</Link></li>
              <li><Link to="#" className="hover:text-indigo-400 transition-colors">Commission Rates</Link></li>
            </ul>
          </div>

          {/* Newsletter / Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4 font-display">Subscribe</h4>
            <p className="text-sm text-slate-400">Sign up for promotions, new arrivals, and coupon releases.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Email Address"
                className="w-full px-3.5 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white p-2 rounded-lg transition-colors shrink-0"
                aria-label="Subscribe"
              >
                <Mail size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Legal / Payment Bar */}
      <div className="border-t border-slate-800/80 bg-slate-950/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <ShieldCheck size={16} className="text-indigo-400" />
            <span>Secure 256-bit SSL encrypted checkout. Payments powered by Razorpay.</span>
          </div>
          <div>
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} ApexMarket. All rights reserved. Created with modern MERN stack guidelines.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

