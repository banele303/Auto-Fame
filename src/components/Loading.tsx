import { Loader2 } from "lucide-react";
import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm z-[100]">
      
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-indigo-50 pointer-events-none opacity-70"></div>
      
      
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>
      
      
      <div className="relative flex flex-col items-center justify-center z-10  p-8 rounded-2xl ">
        
        <div className="absolute w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        
        
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
        </div>
        
        
        <p className="mt-4 text-blue-600 font-medium animate-pulse">Loading...</p>
        
        
        <div className="mt-2 relative h-1 w-40 bg-gray-100 overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 w-full animate-progress rounded-full"></div>
        </div>
      </div>
    </div>
  );
};























export default Loading;