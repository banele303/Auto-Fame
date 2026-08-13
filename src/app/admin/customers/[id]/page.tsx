"use client";

import React from "react";
import { useParams } from "next/navigation";
import CustomerDetailsClient from "./CustomerDetails"; 


export default function CustomerDetailsPage() { 
  
  const params = useParams();
  const id = params.id as string;
  
  return (
    <CustomerDetailsClient id={id} />
  );
}