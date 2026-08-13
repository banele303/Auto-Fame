// Updated icons
import { Car, Users, DollarSign, ShieldCheck } from "lucide-react";

// Renamed component
export default function FeaturesDealershipSection() {
  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 max-w-9xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-5 bg-sky-50 rounded-3xl p-8 md:p-12">
          <div className="mb-2">
            <span className="text-cyan-500 text-sm font-medium">SaCar Dealership at your service</span>
            <div className="w-16 h-0.5 bg-cyan-500 mt-1"></div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mt-6 mb-6">
            South Africa&apos;s <span className="font-script italic">premier</span> automotive sales platform.
          </h2>

          <p className="text-slate-700 leading-relaxed">
            We connect car dealerships with buyers looking for their next vehicle. Since 2008, we have grown
            massively to bring you some of the leading and biggest dealerships in South Africa! We have expanded our
            work nationwide! We are dedicated to seamlessly connecting buyers to quality vehicles like
            yours.
          </p>
        </div>

        
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="flex gap-4">
            <div className="bg-sky-50 p-4 rounded-xl h-fit">
              <Car className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Wide Reach</h3>
              <p className="text-slate-600 text-sm">
                Showcase your inventory to thousands of potential buyers across South Africa, increasing your visibility and sales opportunities.
              </p>
            </div>
          </div>

          
          <div className="flex gap-4">
            <div className="bg-sky-50 p-4 rounded-xl h-fit">
              <Users className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Qualified Leads</h3>
              <p className="text-slate-600 text-sm">
                Our platform attracts serious buyers actively searching for vehicles, providing you with high-quality leads ready to purchase.
              </p>
            </div>
          </div>

          
          <div className="flex gap-4">
            <div className="bg-sky-50 p-4 rounded-xl h-fit">
              <DollarSign className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Streamlined Sales Process</h3>
              <p className="text-slate-600 text-sm">
                Manage your listings, inquiries, and sales efficiently with our intuitive tools, saving you time and effort.
              </p>
            </div>
          </div>

          
          <div className="flex gap-4">
            <div className="bg-sky-50 p-4 rounded-xl h-fit">
              <ShieldCheck className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg mb-2">Trusted Partnership</h3>
              <p className="text-slate-600 text-sm">
                Join a network of reputable dealerships and build trust with buyers through our secure and transparent platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}