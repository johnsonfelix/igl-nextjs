import React from "react";

export default function PrivacyPolicy() {
    return (
        <main className="container mx-auto px-4 py-16 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[#004aad]">Privacy Policy for Innovative Global Logistics Allianz (IGLA)</h1>
                <p className="text-gray-500 mb-8 italic">Last updated: 25-11-2025</p>

                <div className="prose prose-blue max-w-none text-gray-700 space-y-8">
                    <section>
                        <p className="leading-relaxed">
                            Innovative Global Logistics Allianz (IGLA) ("the App") is developed to support communication, event participation, and networking among logistics companies. We value your privacy and are committed to protecting your personal data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                        <p className="mb-4">We may collect the following information when you use the App:</p>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">a. Personal Information</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Name</li>
                                <li>Email address</li>
                                <li>Phone number</li>
                                <li>Company details</li>
                                <li>Profile information</li>
                            </ul>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">b. Usage Data</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>App activity</li>
                                <li>Device information</li>
                                <li>Log data (IP, OS version, app version)</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-[#004aad] mb-2">c. Optional Data</h3>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Documents or images uploaded by you</li>
                                <li>Meeting schedules, chat messages, and event preferences</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <p className="mb-2">Your information is used to:</p>
                        <ul className="list-disc pl-6 space-y-1 mb-4">
                            <li>Create and manage your user account</li>
                            <li>Facilitate communication with other users</li>
                            <li>Provide event schedules, meeting tools and conference services</li>
                            <li>Improve app functionality and user experience</li>
                            <li>Ensure security and prevent fraudulent activity</li>
                        </ul>
                        <p className="font-medium">We do not sell your data to third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing</h2>
                        <p className="mb-2">We may share your data only with:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Other users when you interact (messages, meetings, company profiles)</li>
                            <li>Service providers used for hosting, notifications, and analytics</li>
                            <li>Authorities if required by law</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                        <p className="mb-2">We use industry-standard security practices including:</p>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Encrypted communication</li>
                            <li>Secure authentication</li>
                            <li>Regular security audits</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Choices</h2>
                        <p className="mb-2">You can:</p>
                        <ul className="list-disc pl-6 space-y-1 mb-4">
                            <li>Update your profile</li>
                            <li>Delete your messages or uploaded data</li>
                            <li>Request account deletion at any time via support</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Children's Privacy</h2>
                        <p>
                            IGLA is intended for business professionals only and not for children under 13.
                        </p>
                    </section>

                    <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
                        <p className="mb-4">If you have any questions, contact us at:</p>
                        <div className="space-y-2">
                            <p>
                                <span className="font-semibold">Email:</span> <a href="mailto:igla.webhooks@gmail.com" className="text-blue-600 hover:underline">igla.webhooks@gmail.com</a>
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
