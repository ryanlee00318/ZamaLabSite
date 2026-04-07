import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import SearchModal from '../SearchModal';

export default function NavBar() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <>
            <div className="h-[100px] px-12 flex items-center justify-between bg-[#f6f6f6]">
                <div className="flex items-center">
                    <div>
                        <img className="h-10 w-auto" src="https://tronenergy.market/blog/content/images/2024/04/TEM_LogoPositivo_1.png" />
                    </div>
                    <div className="flex ml-8 gap-10">
                        <a href="/" className="text-sm font-medium hover:text-gray-900">Home</a>
                        <a href="/" className="text-sm font-medium hover:text-gray-900">BUY ENERGY</a>
                        <a href="/" className="text-sm font-medium hover:text-gray-900">SELL ENERGY</a>
                        <a href="/" className="text-sm font-medium hover:text-gray-900">MINT ZAMA</a>
                        <a href="/" className="text-sm font-medium hover:text-gray-900">WHY USE US</a>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="rounded-full p-2 transition hover:bg-black/5"
                    aria-label="Open search"
                >
                    <SearchIcon className="cursor-pointer" />
                </button>
            </div>
            <SearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
            />
        </>
    )
}
