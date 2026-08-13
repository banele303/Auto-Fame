"use client";

import Loading from "@/components/Loading";
import SettingsForm from "@/components/SettingsForm";
import {
  useGetAuthUserQuery,
  useUpdateEmployeeSettingsMutation, 
} from "@/state/api";
import React from "react";

const EmployeeSettings = () => {
  const { data: authUser, isLoading } = useGetAuthUserQuery();
  const [updateEmployee] = useUpdateEmployeeSettingsMutation(); 

  if (isLoading) return <Loading />;

  const initialData = {
    name: authUser?.userInfo?.name || "",
    email: authUser?.userInfo?.email || "",
    phoneNumber: authUser?.userInfo?.phoneNumber || "",
  };

  const handleSubmit = async (data: typeof initialData) => {
    if (!authUser?.cognitoInfo?.userId) {
      console.error("No user ID found");
      return;
    }

    await updateEmployee({ 
      cognitoId: authUser.cognitoInfo.userId,
      ...data,
    });
  };

  return (
    <div className="flex justify-center md:mx-w-10xl">
      <SettingsForm
        initialData={initialData}
        onSubmit={handleSubmit}
        userType="employee" 
      />
    </div>
  );
};

export default EmployeeSettings; 
