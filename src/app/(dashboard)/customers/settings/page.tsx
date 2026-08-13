"use client";

import SettingsForm from "@/components/SettingsForm";
import {
  useGetAuthUserQuery,
  useUpdateCustomerSettingsMutation, // Updated hook
} from "@/state/api";
import React from "react";

// Changed component name
const CustomerSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateCustomer] = useUpdateCustomerSettingsMutation(); // Changed variable name

  if (isLoading) return <>Loading...</>;

  // Make sure we have valid user data and the correct role
  if (!authUser || authUser.userRole !== 'customer') { // Updated userRole
    return (
      <div className="flex bg-[#0F1112] justify-center p-8">
        <div className="text-white text-center">
          <h2 className="text-xl font-bold mb-2">Access Restricted</h2>
          <p>This page is only accessible to customer users.</p>
        </div>
      </div>
    );
  }

  const initialData = {
    name: authUser?.userInfo?.name || '',
    email: authUser?.userInfo?.email || '',
    phoneNumber: authUser?.userInfo?.phoneNumber || '',
  };

  const handleSubmit = async (data: typeof initialData) => {
    await updateCustomer({ // Changed variable name
      cognitoId: authUser?.cognitoInfo?.userId || "",
      ...data,
    });
  };

  return (

    <div className="flex bg-[#0F1112] justify-center md:mx-w-10xl">
 <SettingsForm
      initialData={initialData}
      onSubmit={handleSubmit}
      userType="customer" // Updated userType
    />
    </div>
   
  );
};

export default CustomerSettings; // Changed export name
