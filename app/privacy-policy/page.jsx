import { Navbar } from '../../frontend/components/Navbar';

export const metadata = {
  title: 'Privacy Policy | Klasik Wardrobe',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col text-[#1a1a1a]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-16">
        <h1 className="font-['Syne'] text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral font-['DM_Sans'] text-neutral-600 space-y-6">
          <p>
            At Klasik Wardrobe, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our website.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">1. Personal Information We Collect</h2>
          <p>
            When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">2. How Do We Use Your Personal Information?</h2>
          <p>
            We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">3. Data Retention</h2>
          <p>
            When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
          </p>

          <p className="mt-8 pt-8 border-t border-neutral-200 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>
    </div>
  );
}
