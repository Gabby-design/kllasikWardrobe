import { Navbar } from '../../frontend/components/Navbar';

export const metadata = {
  title: 'Terms of Service | Klasik Wardrobe',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col text-[#1a1a1a]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-32 pb-16">
        <h1 className="font-['Syne'] text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-neutral font-['DM_Sans'] text-neutral-600 space-y-6">
          <p>
            Welcome to Klasik Wardrobe. By accessing our website, you agree to be bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">1. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Klasik Wardrobe's website for personal, non-commercial transitory viewing only.
          </p>
          
          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">2. Disclaimer</h2>
          <p>
            The materials on Klasik Wardrobe's website are provided on an 'as is' basis. Klasik Wardrobe makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-xl font-bold text-[#1a1a1a] mt-8 mb-4">3. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of Nigeria and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>

          <p className="mt-8 pt-8 border-t border-neutral-200 text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </main>
    </div>
  );
}
