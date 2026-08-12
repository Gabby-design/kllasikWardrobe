import { Navbar } from '../../frontend/components/Navbar';

export const metadata = {
  title: 'Refund Policy | Klasik Wardrobe',
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col text-[#1a1a1a]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-16">
        <h1 className="font-['Syne'] text-4xl font-bold mb-8">Return & Exchange Policy</h1>
        
        <div className="prose prose-neutral font-['DM_Sans'] text-neutral-600 space-y-6">
          <p>
            We want you to be completely satisfied with your purchase from Klasik Wardrobe. If for any reason you are not, we will gladly accept returns or exchanges within 7 days of delivery.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">1. Eligibility</h2>
          <p>
            To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging with all tags attached.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">2. Process</h2>
          <p>
            To initiate a return or exchange, please contact our concierge team at <strong>concierge@klassicwardrobe.com</strong> with your order number and details. We will provide you with instructions on how and where to send your package.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">3. Refunds</h2>
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment within 5-7 business days.
          </p>

          <p className="mt-8 pt-8 border-t border-neutral-200 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>
    </div>
  );
}
