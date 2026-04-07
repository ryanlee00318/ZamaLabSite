export default function Footer() {
    return (
        <div className="h-[180px] flex items-center justify-between px-12 text-[#999] text-sm">
            <div>
                Tron Energy Market © 2026
            </div>
            <div className="flex gap-6">
                <div>
                    <a className="cursor-pointer">Twitter</a>
                </div>
                <div className="relative">
                    <a className="cursor-pointer before:content-['•'] before:text-[0.9rem] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2">Telegram</a>
                </div>
                <div className="relative">
                    <a className="cursor-pointer before:content-['•'] before:text-[0.9rem] before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2">Email</a>
                </div>
            </div>
            <div>
                tronenergy.market
            </div>
        </div>
    )
}