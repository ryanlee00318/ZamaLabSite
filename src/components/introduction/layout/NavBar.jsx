import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SearchModal from '../SearchModal';
// import logo from '../../../assets/logo.gif';
import tlogo from '../../../assets/t-logo.png';

export default function NavBar() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navLinks = [
        { label: 'Home', href: '/' },
        { label: 'BUY ENERGY', href: '/' },
        { label: 'SELL ENERGY', href: '/' },
        { label: 'MINT ZAMA', href: '/' },
        { label: 'WHY USE US', href: '/' },
    ];

    return (
        <>
            <div className="bg-[#f6f6f6] px-4 py-4 sm:px-6 lg:px-12">
                <div className="mx-auto hidden max-w-7xl md:flex md:items-center md:justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex justify-center md:justify-start">
                            {/* <img className="h-9 w-auto sm:h-10" src={logo} /> */}
                            <a href='/'>
                                <img className="h-9 w-auto sm:h-16" src={tlogo} />
                            </a>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 md:justify-start lg:gap-x-10">
                            {navLinks.map((link) => (
                                <a key={link.label} href={link.href} className="text-sm font-medium hover:text-gray-900">
                                    {link.label}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center md:justify-end">
                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(true)}
                            className="rounded-full p-2 transition hover:bg-black/5"
                            aria-label="Open search"
                        >
                            <SearchIcon className="cursor-pointer" />
                        </button>
                    </div>
                </div>

                <div className="mx-auto flex max-w-7xl items-center justify-between md:hidden">
                    <div className='flex items-center'>
                        {/* <img className="h-10 w-auto" src={logo} /> */}
                        <img className="h-10 w-auto" src={tlogo} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                setIsSearchOpen(true);
                            }}
                            className="rounded-full p-2 text-[#1f2937] transition hover:bg-black/5"
                            aria-label="Open search"
                        >
                            <SearchIcon />
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMobileMenuOpen((value) => !value)}
                            className="rounded-full p-2 text-[#1f2937] transition hover:bg-black/5"
                            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white md:hidden">
                    <div className="flex items-center justify-between px-4 py-4">
                        <div className='flex items-center'>
                            {/* <img className="h-10 w-auto" src={logo} /> */}
                            <img className="h-10 w-auto" src={tlogo} />
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    setIsSearchOpen(true);
                                }}
                                className="rounded-full p-2 text-[#1f2937] transition hover:bg-black/5"
                                aria-label="Open search"
                            >
                                <SearchIcon />
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="rounded-full p-2 text-[#1f2937] transition hover:bg-black/5"
                                aria-label="Close navigation menu"
                            >
                                <CloseIcon />
                            </button>
                        </div>
                    </div>

                    <div className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center gap-10 px-6 pb-16">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-[2.1rem] font-medium leading-none text-[#0f172a]"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label === 'MINT ZAMA' ? 'Mint TEM' : link.label === 'WHY USE US' ? 'Why use us?' : link.label === 'BUY ENERGY' ? 'Buy Energy' : link.label === 'SELL ENERGY' ? 'Sell Energy' : link.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    );
}
