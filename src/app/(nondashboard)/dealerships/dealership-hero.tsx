import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

export default function DealershipHero() {
  return (
    <div className="min-h-[70vh] bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{
          backgroundImage: "url('/hero-1.jpg')",
        }}
      />
      
      
      <div className="absolute inset-0 bg-blue-900 opacity-60"></div>

     

      
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 text-center">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center justify-center mb-8">
            <div className="h-px bg-white w-16"></div>
            <span className="px-4 text-white text-sm font-medium">Partner with SaCar Dealership</span>
            <div className="h-px bg-white w-16"></div>
          </div>

          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-8 leading-tight">
            Expand Your Reach. Drive More Sales.
          </h2>

          
          <p className="text-white text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
            Partner with SaCar Dealership to showcase your inventory to a wider audience.
            Streamline your sales process, connect with qualified buyers, and grow your business.
          </p>

          
          <Button
            size="lg"
            className="bg-cyan-400 hover:bg-cyan-500 text-white px-8 py-4 text-lg font-semibold rounded-full border-0 shadow-lg hover:shadow-xl transition-all"
          >
            Register Your Dealership
          </Button>
        </div>

        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <ChevronDown className="w-5 h-5 text-blue-500" />
          </div>
        </div>
      </main>
    </div>
  )
}
