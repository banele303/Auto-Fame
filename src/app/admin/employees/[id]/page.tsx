"use client";

import React from "react";
import { useParams } from "next/navigation";
import EmployeeDetails from "./EmployeeDetails"; 


export default function EmployeeDetailsPage() { 
  
  const params = useParams();
  const id = params.id as string;
  
  return (
    <EmployeeDetails id={id} />
  );
}
