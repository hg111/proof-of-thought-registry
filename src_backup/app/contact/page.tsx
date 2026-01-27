import Link from 'next/link';

export default function ContactPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 px-6">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-gray-600 mb-8 inline-block">
                &larr; Back to Home
            </Link>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Get in Touch</h1>

            <div className="bg-white border text-center border-gray-200 rounded-xl p-8 shadow-sm">
                <p className="text-lg text-gray-600 mb-6">
                    For inquiries, partnerships, or support, please email us at:
                </p>

                <a
                    href="mailto:team.proofofthought@gmail.com"
                    className="text-2xl font-medium text-blue-600 hover:text-blue-500 hover:underline"
                >
                    team.proofofthought@gmail.com
                </a>
            </div>
        </div>
    );
}
