import Image from "next/image";

// Renamed component
export default function DealershipBenefitsSection() {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-gradient-to-br from-blue-300 to-blue-400 rounded-3xl p-8 md:p-10"> 
            <h3 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 leading-tight"> 
              Manage your inventory with ease on our <span className="font-script italic">comprehensive</span> dealership
              portal.
            </h3>
            <p className="text-blue-800 text-sm leading-relaxed"> 
              Whether you&apos;re tech-savvy or not, our dealership portal makes it easy for you to create and manage your
              car listings. Our intuitive step-by-step creation tool walks you through the entire process, allowing you to add
              all necessary details at your own pace. Need a break? You can save your progress and continue later,
              ensuring you never lose any work. Complete control over your listings: The dealership portal gives you the
              flexibility to edit, update, or delete vehicles with just a few clicks. Whether you need to adjust
              pricing, add new photos, or make changes to the car description, our system makes it simple.
            </p>
          </div>
  
          <div className="bg-gradient-to-br from-green-300 to-green-400 rounded-3xl p-8 md:p-10"> 
            <h3 className="text-2xl md:text-3xl font-bold text-green-900 mb-6 leading-tight">
              Find your <span className="font-script italic">ideal</span> buyer with our tailored sales system.
            </h3>
            <p className="text-green-800 text-sm leading-relaxed"> 
              Our platform&apos;s sales system provides you with comprehensive customer profiles, including key details such
              as contact information, inquiry history, and financing pre-approvals. This valuable information empowers you
              to make informed decisions and connect with buyers who best match your vehicle offerings.
            </p>
          </div>
  
          
          <div className="bg-gradient-to-br from-blue-300 to-blue-400 rounded-3xl p-8 md:p-10 relative overflow-hidden"> 
            
            <div className="absolute bottom-0 left-0 right-0">
              <Image
                src="/landing-search1.png" // Updated image source
                alt="SaCar Dealership Dashboard"
                width={800}
                height={300}
                className="w-full h-auto object-cover object-top"
                style={{ maxHeight: "300px" }}
              />
            </div>
            
            <div className="relative z-10 bg-gradient-to-b from-blue-300/90 to-transparent pb-32"> 
              <div className="bg-blue-300/80 rounded-2xl p-6 backdrop-blur-sm"> 
                <p className="text-blue-800 text-sm leading-relaxed"> 
                  Whether you&apos;re tech-savvy or not, our dealership portal makes it easy for you to create and manage your
                  listings. Our intuitive step-by-step creation tool walks you through the entire process.
                </p>
              </div>
            </div>
          </div>
  
          <div className="bg-gradient-to-br from-purple-300 to-purple-400 rounded-3xl p-8 md:p-10">
            <h3 className="text-2xl md:text-3xl font-bold text-purple-900 mb-6 leading-tight">
              Only pay when a car is successfully <span className="font-script italic">sold</span>.
            </h3>
            <p className="text-purple-800 text-sm leading-relaxed">
              There are no upfront costs or hidden fees—just a simple, transparent model that ensures you get value for
              your money. This means you can list your vehicles and attract potential buyers without any financial risk.
              We only charge a fee once a car has been sold and delivered, aligning our
              success directly with yours.
            </p>
          </div>
        </div>
      </section>
    )
  }