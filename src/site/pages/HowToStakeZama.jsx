import Layout from "../components/introduction/layout/Layout"

const blogImages = [
    "/images/blog/image-1.png",
    "/images/blog/image-2.png",
    "/images/blog/image-3.png",
]

const relatedLinks = [
    { href: "/", label: "How to buy tron energy on Tronenergy.market" },
    { href: "/", label: "How to sell tron energy on Tronenergy.market" },
    { href: "/blog/how-to-stake-zama", label: "What is ZAMA staking?" },
]

export default function HowToStakeZama() {
    return (
        <Layout title="How to Stake ZAMA">
            <main className="bg-white text-[#111827]">
                <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
                    <p className="text-sm text-[#6b7280]">Apr 17, 2026</p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl">
                        How to stake ZAMA
                    </h1>

                    <div className="mt-8 space-y-6 text-lg leading-8 text-[#374151]">
                        <p>
                            Staking ZAMA is simple and gives you a way to put your tokens to work while supporting the network.
                        </p>
                        <p>
                            Follow the steps below to understand how to stake ZAMA on the platform.
                        </p>
                    </div>

                    <div className="mt-12 space-y-12 text-[#111827]">
                        <section className="space-y-6">
                            <p className="text-lg leading-8">
                                1) Connect your wallet from the top right-hand corner so the platform can detect your ZAMA balance and enable staking actions.
                            </p>
                            <img
                                src={blogImages[0]}
                                alt="Connect wallet section on the ZAMA staking page"
                                className="w-full rounded-sm border border-black/10"
                            />
                        </section>

                        <section className="space-y-6">
                            <p className="text-lg leading-8">
                                2) Review the available staking operators and choose the one that best matches what you are looking for in terms of APR, commission, and total stake.
                            </p>
                            <img
                                src={blogImages[1]}
                                alt="List of ZAMA staking operators"
                                className="w-full rounded-sm border border-black/10"
                            />
                        </section>

                        <section className="space-y-6">
                            <p className="text-lg leading-8">
                                3) Click the stake button for your chosen operator, enter the amount of ZAMA you want to delegate, and review the details before continuing.
                            </p>
                            <img
                                src={blogImages[2]}
                                alt="ZAMA staking amount panel"
                                className="w-full rounded-sm border border-black/10"
                            />
                        </section>

                        <section className="space-y-6">
                            <p className="text-lg leading-8">
                                4) Confirm the transaction in your wallet. Once the transaction is complete, your ZAMA will be staked and you can return to the platform to track rewards and manage your position.
                            </p>
                        </section>
                    </div>

                    <div className="mt-14 space-y-4">
                        {relatedLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="block text-lg text-[#111827] underline decoration-black/20 underline-offset-4 transition hover:decoration-black"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>
                </article>
            </main>
        </Layout>
    )
}
