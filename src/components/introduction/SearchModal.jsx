import SearchIcon from '@mui/icons-material/Search';

export default function SearchModal({ isOpen, onClose }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 bg-white/10 px-8 pt-20 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="mx-auto w-full max-w-[500px] rounded-xl bg-white px-7 py-5 shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
                onClick={(event) => event.stopPropagation()}
            >
                <label className="flex items-center gap-4">
                    <SearchIcon className="text-[#1f2937]" />
                    <input
                        type="text"
                        autoFocus
                        placeholder="Search posts, tags and authors"
                        className="w-full border-none bg-transparent text-[1.05rem] text-[#334155] outline-none placeholder:text-[#94a3b8]"
                    />
                </label>
            </div>
        </div>
    );
}
