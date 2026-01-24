import React from "react";

export default function CookiesPolicy() {
    return (
        <main className="container mx-auto px-4 py-16 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#004aad]">Cookies Policy</h1>
                <p className="text-gray-500 mb-8 italic">Last updated: 25-11-2025</p>

                <div className="prose prose-blue max-w-none text-gray-700 space-y-8">
                    <section>
                        <p className="leading-relaxed">
                            This Cookies Policy explains how Innovative Global Logistics Allianz (IGLA) uses cookies
                            and similar technologies on its website and mobile applications.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
                        <p>
                            Cookies are small text files stored on your device when you visit a website or use an application.
                            They help improve functionality, security, and user experience.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">a) Essential Cookies</h3>
                            <p className="mb-2">These cookies are necessary for:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-2">
                                <li>User login and authentication</li>
                                <li>Account security</li>
                                <li>Session management</li>
                            </ul>
                            <p className="text-sm italic">Without these cookies, the platform cannot function properly.</p>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">b) Performance & Analytics Cookies</h3>
                            <p className="mb-2">These cookies help us:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Understand how users interact with the platform</li>
                                <li>Analyze conference participation and feature usage</li>
                                <li>Improve performance and usability</li>
                            </ul>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">c) Functional Cookies</h3>
                            <p className="mb-2">Used to remember:</p>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>User preferences</li>
                                <li>Language or region settings</li>
                                <li>Login sessions and personalized features</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">d) Third-Party Cookies</h3>
                            <p>
                                We may use trusted third-party services (such as analytics or communication tools) that place
                                cookies to help us operate and improve our services efficiently.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How You Can Manage Cookies</h2>
                        <p className="mb-2">You can manage cookies by:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Adjusting your browser or device settings</li>
                            <li>Deleting existing cookies from your device</li>
                            <li>Disabling non-essential cookies (some features may not work correctly if disabled)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Changes to This Cookies Policy</h2>
                        <p>
                            We may update this Cookies Policy from time to time. Any updates will be posted on this page with a revised date.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
                        <p className="mb-4">If you have questions about this Cookies Policy or how we use cookies, please contact:</p>
                        <div className="space-y-2">
                            <p>
                                <span className="font-semibold">Email:</span> <a href="mailto:sales@igla.asia" className="text-blue-600 hover:underline">sales@igla.asia</a>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
