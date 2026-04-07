export default function Footer() {
    return (
        <div className="px-4 py-12 text-sm text-[#999] sm:px-6 lg:px-12">
            <div className="mx-auto flex max-w-7xl flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
                <div>
                    Tron Energy Market &copy; 2026
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                    <a className="cursor-pointer">Twitter</a>
                    <a className="cursor-pointer">Telegram</a>
                    <a className="cursor-pointer">Email</a>
                </div>
                <div>
                    tronenergy.market
                </div>
            </div>
        </div>
    );
}
