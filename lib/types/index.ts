export interface Client {
  id: string;
  user_ID: string;
  User_ID?: string;
  Customer_ID?: string;
  Name1: string;
  Full_Name: string;
  Last_Name: string;
  Mobile: string;
  Email: string | null;
  
  // Personal Information
  Gender?: string;
  Date_of_Birth?: string;
  Place_of_Birth?: string;
  Religion?: string;
  Nationality?: string;
  Marital_Status?: string;
  Spouse_Name?: string;
  Mother_Name?: string;
  Education_Details?: string;
  Job_Details?: string;
  Occupation?: string;
  Position_Details?: string;
  Income_IDR?: number | string;
  Company_Name?: string;
  Department?: string;
  Length_of_Work?: string;
  
  // Contact Information
  Home_Phone?: string;
  Office_Phone?: string;
  Any_other_phone_No?: string;
  Mobile_1?: string;
  Mobile_2?: string;
  Mobile_3?: string;
  Mobile_4?: string;
  Mobile_5?: string;
  Mobile_6?: string;
  Mobile_7?: string;
  Mobile_8?: string;
  Mobile_9?: string;
  Mobile_10?: string;
  
  // Address Information
  CA_Line_1: string;
  CA_Line_2: string | null;
  CA_City: string;
  CA_RT_RW?: string;
  CA_Sub_District?: string;
  CA_District?: string;
  CA_Province?: string;
  CA_ZipCode?: string;
  
  // KTP Address
  KTP_Address?: string;
  KTP_Village?: string;
  KTP_District?: string;
  KTP_City?: string;
  KTP_Province?: string;
  KTP_Postal_Code?: string;
  
  // Residence Address
  RA_Line_1?: string;
  RA_Line_2?: string;
  RA_Line_3?: string;
  RA_Line_4?: string;
  RA_RT_RW?: string;
  Residence_Address_SubDistrict?: string;
  RA_District?: string;
  Residence_Address_City?: string;
  Residence_Address_Province?: string;
  RA_Zip_Code?: string;

  // Office Address
  OA_Line_1?: string;
  OA_Line_2?: string;
  OA_Line_3?: string;
  OA_Line_4?: string;
  OA_RT_RW?: string;
  Office_Address_SubDistrict?: string;
  Office_Address_District?: string;
  Office_Address_City?: string;
  Office_Address_Province?: string;
  Office_Address_Zipcode?: string;
  
  // Emergency Contacts
  Emegency_Contact_Name?: string;
  Emergency_Contact_Phone?: string;
  EC1_Name?: string;
  EC1_Relation?: string;
  EC1_Phone?: string;
  EC2_Name?: string;
  EC2_Relation?: string;
  EC2_Phone?: string;
  
  // Financial Information
  Current_Status: string;
  Total_OS_Yesterday1: string;
  Last_Statement_MAD: string;
  Last_Statement_TAD: string;
  Last_Payment_Amount: string;
  Last_Payment_Date?: string;
  Last_Statement_Date?: string;
  Days_Past_Due: string;
  DPD_Bucket: string;
  Visitor_Score?: string;
  Repayment_Amount?: string | number;
  Buyback_Amount_Paid_By_Skor1?: string | number;
  Credit_Limit?: string | number;
  Age_in_Bank?: string | number;
  Latest_Statement_Due_Date?: string;
  Buy_Back_Status?: string;
  Rep_Status_Current_Bill?: string;
  Record_Status__s?: string;
  
  // Skor User ID for photos
  Skor_User_ID?: string;
  
  // System Information
  RoboCall_30_60_LastStatus?: string;
  Vapi_Robocall?: string;
  Last_Call_Action_Status?: string;
  Email_Opt_Out?: boolean;
  woztellplatformintegration__WhatsApp_Opt_Out?: boolean;
  
  // Activity Information
  Created_Time: string;
  Modified_Time: string;
  Last_Activity_Time?: string;
  Last_Visited_Time?: string;
  Days_Visited?: number;
  Number_Of_Chats?: number;
  Average_Time_Spent_Minutes?: number;
  
  // Owner Information
  FI_Owner?: string;
  Owner?: {
    id: string;
    name: string;
    email: string;
  };
  Created_By?: {
    id: string;
    name: string;
    email: string;
  };
  Modified_By?: {
    id: string;
    name: string;
    email: string;
  };
  
  Call_Notes: string | null;
}

export interface Contactability {
  id: string;
  client_id: string;
  client_name: string;
  skor_user_id: string;
  Channel: 'Visit' | 'Call' | 'Message';
  Visit_Action?: 'OPC' | 'RPC' | 'TPC';
  Visit_Status?: string;
  Visit_Location?: string;
  Visit_By_Skor_Team?: 'Yes' | 'No';
  Visit_Notes?: string;
  Call_Notes?: string;
  Message_Content?: string;
  Message_Type?: 'WhatsApp' | 'SMS' | 'Email';
  Contact_Result: string;
  Person_Contacted: string;
  Action_Location: string;
  Contact_Date: string;
  latitude: string;
  longitude: string;
  Agent_Name: string;
  image1?: string;
  image2?: string;
  image3?: string;
  audio_file?: string;
}
