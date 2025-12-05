# Client Details Screen Documentation

## Overview
The Client Details screen displays comprehensive client information organized into multiple sections. Each section shows specific data fields with proper formatting and access control based on user team membership.

## Data Sources & API Endpoints
- **Primary Client Data**: From `widget.client.rawApiData` (original API response)
- **EMI Restructuring Data**: From separate API call to `https://n8n.skorcard.app/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32`
- **Photos**: From photo service API calls (KTP and Selfie photos)
- **User Authentication**: From `AuthService` for team-based access control

### API Endpoints Summary
1. **EMI Restructuring API**: `POST https://n8n.skorcard.app/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32`
2. **Photo Service API**: Multiple endpoints for KTP and Selfie photos (detailed below)

---

## Section 1: Client Header Card

### Fields Displayed:
1. **Avatar**: CircleAvatar with person icon (no API field)
2. **Client Name**: `widget.client.name`
3. **Phone Number**: `widget.client.phone` (formatted with StringUtils.formatPhone)
4. **Address**: `widget.client.address`

### Display Logic:
- Always visible for all users
- Phone number is formatted for display
- Shows basic client identification information

---

## Section 2: Basic Information

### Fields Displayed:
1. **Client ID**: `widget.client.id`
   - Display Logic: Always shown, copyable to clipboard
   
2. **Skor User ID**: `widget.client.skorUserId`
   - Display Logic: Only shown if `widget.client.skorUserId != null`
   
3. **Full Name**: `widget.client.name`
   - Display Logic: Always shown, copyable to clipboard
   
4. **Mobile Phone**: `widget.client.phone`
   - Display Logic: Always shown with WhatsApp and Call action buttons
   
5. **Email**: `widget.client.email`
   - Display Logic: Only shown if `widget.client.email != null && widget.client.email!.isNotEmpty`
   
6. **Address**: `widget.client.address`
   - Display Logic: Always shown, copyable to clipboard
   
7. **Distance**: `widget.client.distance`
   - Display Logic: Only shown if `widget.client.distance != null`

---

## Section 3: Photos Section

### Fields Displayed:
1. **KTP Photo**: `_photoPaths['ktp']`
2. **Selfie Photo**: `_photoPaths['selfie']`

### Display Logic:
- **Visibility**: Only shown if `widget.client.skorUserId != null && widget.client.skorUserId!.isNotEmpty`
- **Loading State**: Shows loading indicator when `_isLoadingPhotos = true`
- **Error State**: Shows error message if `_photoError != null`
- **Photo Display**: Shows actual photos or "No photo available" placeholder
- **Interaction**: Clickable to open full-screen view in dialog

### Data Source:
- Photos loaded via `PhotoService.fetchUserPhotos(skorUserId)`
- Local cache checked first via `PhotoService.getLocalPhotoPaths(skorUserId)`

### Photo API Endpoints:

#### 1. KTP Photo API
- **Endpoint**: `GET https://api.skorcard.app/photos/ktp/{skorUserId}`
- **Method**: GET
- **Path Parameter**: 
  - `skorUserId`: String (from client data - `clientData['Skor_User_ID']` or `clientData['user_ID']` or `clientData['User_ID']`)
- **Headers**: 
  ```
  Authorization: Bearer {access_token}
  Content-Type: application/json
  ```
- **Response Success (200)**:
  ```json
  {
    "status": "success",
    "data": {
      "photo_url": "https://storage.skorcard.app/photos/ktp/12345_ktp.jpg",
      "upload_date": "2024-01-15T10:30:00Z",
      "file_size": 1024000
    }
  }
  ```
- **Response No Photo (404)**:
  ```json
  {
    "status": "error",
    "message": "Photo not found",
    "code": "PHOTO_NOT_FOUND"
  }
  ```

#### 2. Selfie Photo API
- **Endpoint**: `GET https://api.skorcard.app/photos/selfie/{skorUserId}`
- **Method**: GET
- **Path Parameter**: 
  - `skorUserId`: String (from client data - `clientData['Skor_User_ID']` or `clientData['user_ID']` or `clientData['User_ID']`)
- **Headers**: 
  ```
  Authorization: Bearer {access_token}
  Content-Type: application/json
  ```
- **Response Success (200)**:
  ```json
  {
    "status": "success",
    "data": {
      "photo_url": "https://storage.skorcard.app/photos/selfie/12345_selfie.jpg",
      "upload_date": "2024-01-15T10:35:00Z",
      "file_size": 856000
    }
  }
  ```
- **Response No Photo (404)**:
  ```json
  {
    "status": "error",
    "message": "Photo not found", 
    "code": "PHOTO_NOT_FOUND"
  }
  ```

### Photo Loading Logic:
1. **Check skorUserId availability**: Must have valid `Skor_User_ID`, `user_ID`, or `User_ID` from client data
2. **Call both APIs**: Make parallel calls to KTP and Selfie endpoints
3. **Handle responses**:
   - Success: Display photo using `photo_url` from response
   - 404/Not Found: Show "No photo available" placeholder
   - Error: Log error, show placeholder (don't show error to user)
4. **Caching**: Web app should implement local storage/session storage for downloaded photos
5. **Image Loading**: Use `photo_url` directly in `<img>` tag with error handling

---

## Section 4: Contact Information

### Fields Displayed:
1. **Home Phone**: API Field `clientData['Home_Phone']`
   - Display Logic: Only shown if `_hasValue(clientData?['Home_Phone'])`
   - Actions: WhatsApp and Call buttons
   
2. **Office Phone**: API Field `clientData['Office_Phone']`
   - Display Logic: Only shown if `_hasValue(clientData?['Office_Phone'])`
   - Actions: WhatsApp and Call buttons
   
3. **Other Phone**: API Field `clientData['Any_other_phone_No']`
   - Display Logic: Only shown if `_hasValue(clientData?['Any_other_phone_No'])`
   - Actions: WhatsApp and Call buttons
   
4. **Email**: API Field `clientData['Email']`
   - Display Logic: Only shown if `_hasValue(clientData?['Email'])`
   
5. **Emergency Contact 1 Name**: API Field `clientData['EC1_Name']`
   - Display Logic: Only shown if `_hasValue(clientData?['EC1_Name'])`
   
6. **EC1 Phone**: API Field `clientData['EC1_Phone']`
   - Display Logic: Only shown if `_hasValue(clientData?['EC1_Phone'])`
   - Actions: WhatsApp and Call buttons
   
7. **EC1 Relation**: API Field `clientData['EC1_Relation']`
   - Display Logic: Only shown if `_hasValue(clientData?['EC1_Relation'])`
   
8. **Emergency Contact 2 Name**: API Field `clientData['EC2_Name']`
   - Display Logic: Only shown if `_hasValue(clientData?['EC2_Name'])`
   
9. **EC2 Phone**: API Field `clientData['EC2_Phone']`
   - Display Logic: Only shown if `_hasValue(clientData?['EC2_Phone'])`
   - Actions: WhatsApp and Call buttons
   
10. **EC2 Relation**: API Field `clientData['EC2_Relation']`
    - Display Logic: Only shown if `_hasValue(clientData?['EC2_Relation'])`
    
11. **Emergency Contact**: API Field `clientData['Emegency_Contact_Name']`
    - Display Logic: Only shown if `_hasValue(clientData?['Emegency_Contact_Name'])`

### Fallback Logic:
- If no API contact data available, shows basic email from `widget.client.email`

---

## Section 5: Personal Information

### Fields Displayed:
1. **Gender**: API Field `clientData['Gender']`
   - Display Logic: Only shown if `_hasValue(clientData?['Gender'])`

---

## Section 6: Correspondence Address

### Fields Displayed:
1. **Address**: Combined from API Fields
   - `clientData['CA_Line_1']`
   - `clientData['CA_Line_2']`  
   - `clientData['CA_Line_3']`
   - `clientData['CA_Line_4']`
   - Display Logic: Combines non-empty values with ", " separator, copyable
   
2. **RT/RW**: API Field `clientData['CA_RT_RW']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_RT_RW'])`
   
3. **Sub District**: API Field `clientData['CA_Sub_District']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_Sub_District'])`
   
4. **District**: API Field `clientData['CA_District']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_District'])`
   
5. **City**: API Field `clientData['CA_City']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_City'])`
   
6. **Province**: API Field `clientData['CA_Province']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_Province'])`
   
7. **Zip Code**: API Field `clientData['CA_ZipCode']`
   - Display Logic: Only shown if `_hasValue(clientData?['CA_ZipCode'])`, copyable

---

## Section 7: KTP Address

### Fields Displayed:
1. **Address**: API Field `clientData['KTP_Address']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_Address'])`, copyable
   
2. **Village**: API Field `clientData['KTP_Village']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_Village'])`
   
3. **District**: API Field `clientData['KTP_District']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_District'])`
   
4. **City**: API Field `clientData['KTP_City']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_City'])`
   
5. **Province**: API Field `clientData['KTP_Province']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_Province'])`
   
6. **Postal Code**: API Field `clientData['KTP_Postal_Code']`
   - Display Logic: Only shown if `_hasValue(clientData?['KTP_Postal_Code'])`, copyable

---

## Section 8: Residence Address

### Fields Displayed:
1. **Address**: Combined from API Fields
   - `clientData['RA_Line_1']`
   - `clientData['RA_Line_2']`
   - `clientData['RA_Line_3']`
   - `clientData['RA_Line_4']`
   - Display Logic: Combines non-empty values with ", " separator, copyable
   
2. **RT/RW**: API Field `clientData['RA_RT_RW']`
   - Display Logic: Only shown if `_hasValue(clientData?['RA_RT_RW'])`
   
3. **Sub District**: API Field `clientData['Residence_Address_SubDistrict']`
   - Display Logic: Only shown if `_hasValue(clientData?['Residence_Address_SubDistrict'])`
   
4. **District**: API Field `clientData['RA_District']`
   - Display Logic: Only shown if `_hasValue(clientData?['RA_District'])`
   
5. **City**: API Field `clientData['Residence_Address_City']`
   - Display Logic: Only shown if `_hasValue(clientData?['Residence_Address_City'])`
   
6. **Province**: API Field `clientData['Residence_Address_Province']`
   - Display Logic: Only shown if `_hasValue(clientData?['Residence_Address_Province'])`
   
7. **Zip Code**: API Field `clientData['RA_Zip_Code']`
   - Display Logic: Only shown if `_hasValue(clientData?['RA_Zip_Code'])`, copyable

---

## Section 9: Financial Information

### Fields Displayed:
1. **Total Outstanding**: API Field `clientData['Total_OS_Yesterday1']`
   - Display Logic: Only shown if `_hasValue(clientData?['Total_OS_Yesterday1'])`
   - Formatting: Currency format (Rp x.xxx.xxx)
   
2. **Last Statement MAD**: API Field `clientData['Last_Statement_MAD']`
   - **Access Control**: Only visible to Skorcard team (`_isSkorCardUser()`)
   - **Additional Logic**: Only shown if `clientData?['Buy_Back_Status'] != "True"`
   - Display Logic: Only shown if `_hasValue(clientData?['Last_Statement_MAD'])`
   - Formatting: Currency format, copyable
   
3. **Last Statement TAD**: API Field `clientData['Last_Statement_TAD']`
   - **Access Control**: Only visible to Skorcard team (`_isSkorCardUser()`)
   - **Additional Logic**: Only shown if `clientData?['Buy_Back_Status'] != "True"`
   - Display Logic: Only shown if `_hasValue(clientData?['Last_Statement_TAD'])`
   - Formatting: Currency format, copyable
   
4. **Last Payment Amount**: API Field `clientData['Last_Payment_Amount']`
   - Display Logic: Only shown if `_hasValue(clientData?['Last_Payment_Amount'])`
   - Formatting: Currency format
   
5. **Last Payment Date**: API Field `clientData['Last_Payment_Date']`
   - Display Logic: Only shown if `_hasValue(clientData?['Last_Payment_Date'])`
   - Formatting: Indonesian date format
   
6. **Rep Status Current Bill**: API Field `clientData['Rep_Status_Current_Bill']`
   - Display Logic: Only shown if `_hasValue(clientData?['Rep_Status_Current_Bill'])`
   
7. **Repayment Amount**: API Field `clientData['Repayment_Amount']`
   - Display Logic: Only shown if `_hasValue(clientData?['Repayment_Amount'])`
   - Formatting: Currency format
   
8. **Buy Back Status**: API Field `clientData['Buy_Back_Status']`
   - **Access Control**: Only visible to Skorcard team (`_isSkorCardUser()`)
   - Display Logic: Only shown if `_hasValue(clientData?['Buy_Back_Status'])`
   
9. **Days Past Due**: API Field `clientData['Days_Past_Due']`
   - Display Logic: Only shown if `_hasValue(clientData?['Days_Past_Due'])`
   
10. **DPD Bucket**: API Field `clientData['DPD_Bucket']`
    - Display Logic: Only shown if `_hasValue(clientData?['DPD_Bucket'])`

---

## Section 10: EMI Restructuring Information

### API Specification:
- **Endpoint**: `POST https://n8n.skorcard.app/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32`
- **Method**: POST
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Request Payload**: 
  ```json
  {
    "id": "CLIENT_ID_HERE"
  }
  ```
- **Payload Fields**:
  - `id`: String (from `widget.client.id` - the primary client identifier)

### Response Handling:
- **Success Response Structure**:
  ```json
  [
    {
      "data": [
        {
          "Original_Due_Amount": "5000000",
          "Due_Date": "2024-12-31",
          "Tenure": "12",
          "Current_Due_Amount": "4200000",
          "Total_Paid_Amount": "800000"
        }
      ]
    }
  ]
  ```
- **Data Extraction**: Get EMI data from `responseData[0]['data'][0]`
- **Empty Response**: 
  ```json
  [
    {
      "data": []
    }
  ]
  ```
- **Error Handling**: 
  - HTTP 200 with empty data array = No EMI restructuring data available
  - HTTP 400/500 = API error, hide section completely
  - Network error = Hide section completely

### Fields Displayed:
1. **Original Due Amount**: API Field `_emiRestructuringData['Original_Due_Amount']`
   - Display Logic: Only shown if `_hasValue(_emiRestructuringData!['Original_Due_Amount'])`
   - Formatting: Currency format (Rp x.xxx.xxx)
   
2. **Restructure Due Date**: API Field `_emiRestructuringData['Due_Date']`
   - Display Logic: Only shown if `_hasValue(_emiRestructuringData!['Due_Date'])`
   - Formatting: Indonesian date format (DD Bulan YYYY)
   
3. **Restructure Tenure**: API Field `_emiRestructuringData['Tenure']`
   - Display Logic: Only shown if `_hasValue(_emiRestructuringData!['Tenure'])`
   - Formatting: "X months" format
   
4. **Current Due Amount**: API Field `_emiRestructuringData['Current_Due_Amount']`
   - Display Logic: Only shown if `_hasValue(_emiRestructuringData!['Current_Due_Amount'])`
   - Formatting: Currency format (Rp x.xxx.xxx)
   
5. **Total Paid Amount**: API Field `_emiRestructuringData['Total_Paid_Amount']`
   - Display Logic: Only shown if `_hasValue(_emiRestructuringData!['Total_Paid_Amount'])`
   - Formatting: Currency format (Rp x.xxx.xxx)

### Section Visibility:
- **Access Control**: Only visible to Skorcard team (`_isSkorCardUser()`)
- **Data Availability**: Only shown if `_hasEmiData = true`
- **Combined Logic**: `if (_hasEmiData && _isSkorCardUser())`

### Error Handling:
- API errors are logged but don't show error messages to user
- Section is simply hidden if API fails or returns no data

---

## Section 11: Status & Employment

### Fields Displayed:
1. **Status**: `widget.client.status`
   - Display Logic: Always shown
   - Formatting: Capitalized first letter using `AppUtils.StringUtils.capitalizeFirst()`
   
2. **Job Details**: API Field `clientData['Job_Details']`
   - Display Logic: Only shown if `_hasValue(clientData?['Job_Details'])`
   
3. **Position Details**: API Field `clientData['Position_Details']`
   - Display Logic: Only shown if `_hasValue(clientData?['Position_Details'])`
   
4. **Company Name**: API Field `clientData['Company_Name']`
   - Display Logic: Only shown if `_hasValue(clientData?['Company_Name'])`
   
5. **Office Address**: Combined from API Fields
   - `clientData['OA_Line_1']`
   - `clientData['OA_Line_2']`
   - `clientData['OA_Line_3']`
   - `clientData['OA_Line_4']`
   - Display Logic: Combines non-empty values with ", " separator, copyable
   
6. **Office RT/RW**: API Field `clientData['OA_RT_RW']`
   - Display Logic: Only shown if `_hasValue(clientData?['OA_RT_RW'])`
   
7. **Office Sub District**: API Field `clientData['Office_Address_SubDistrict']`
   - Display Logic: Only shown if `_hasValue(clientData?['Office_Address_SubDistrict'])`
   
8. **Office District**: API Field `clientData['Office_Address_District']`
   - Display Logic: Only shown if `_hasValue(clientData?['Office_Address_District'])`
   
9. **Office City**: API Field `clientData['Office_Address_City']`
   - Display Logic: Only shown if `_hasValue(clientData?['Office_Address_City'])`
   
10. **Office Province**: API Field `clientData['Office_Address_Province']`
    - Display Logic: Only shown if `_hasValue(clientData?['Office_Address_Province'])`
    
11. **Office Zipcode**: API Field `clientData['Office_Address_Zipcode']`
    - Display Logic: Only shown if `_hasValue(clientData?['Office_Address_Zipcode'])`, copyable

---

## Frontend Utility Functions & Logic

### Data Validation Functions
- **`hasValue(value)`**: 
  ```javascript
  function hasValue(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && (
      value === '' || 
      value.toLowerCase() === 'null' || 
      value.toLowerCase() === 'na'
    )) return false;
    if (typeof value === 'boolean' && !value) return false;
    return true;
  }
  ```

- **`safeStringValue(value)`**:
  ```javascript
  function safeStringValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return value.toString();
  }
  ```

### Formatting Functions
- **`formatCurrency(value)`**: 
  ```javascript
  function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';
    
    // Remove any existing formatting
    const valueStr = value.toString().replace(/[^\d.]/g, '');
    const amount = parseFloat(valueStr);
    
    if (isNaN(amount)) return value.toString();
    
    // Format with Indonesian Rupiah style (dot as thousands separator)
    const formatter = Math.round(amount).toString();
    const parts = [];
    
    for (let i = formatter.length; i > 0; i -= 3) {
      const start = Math.max(0, i - 3);
      parts.unshift(formatter.substring(start, i));
    }
    
    return 'Rp ' + parts.join('.');
  }
  ```

- **`formatDate(value)`**: 
  ```javascript
  function formatDate(value) {
    if (!value) return 'N/A';
    
    const dateStr = value.toString().trim();
    if (!dateStr || dateStr.toLowerCase() === 'null') return 'N/A';
    
    try {
      // Parse YYYY-MM-DD format
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      const monthNames = [
        '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      
      if (month < 1 || month > 12) return dateStr;
      
      return `${day} ${monthNames[month]} ${year}`;
    } catch (e) {
      return dateStr;
    }
  }
  ```

### Access Control Functions
- **`isSkorCardUser(userTeam)`**: 
  ```javascript
  function isSkorCardUser(userTeam) {
    return userTeam && userTeam.toLowerCase() === 'skorcard';
  }
  ```
  - Input: `userTeam` from authentication service/JWT token
  - Used for Financial Information sensitive fields and EMI Restructuring section

### Action Handlers
- **Phone Actions**: 
  ```javascript
  function openWhatsApp(phone) {
    // Format phone for WhatsApp (remove leading 0, add 62)
    let formattedPhone = phone.replace(/[^\d]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }
    
    const url = `https://wa.me/${formattedPhone}`;
    window.open(url, '_blank');
  }
  
  function makePhoneCall(phone) {
    const url = `tel:${phone}`;
    window.location.href = url;
  }
  ```

- **Copy to Clipboard**: 
  ```javascript
  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      // Show success notification
      showNotification(`${label} copied to clipboard`, 'success');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification(`${label} copied to clipboard`, 'success');
    }
  }
  ```

### Address Combination Logic
- **`combineAddressLines(addressData, prefix)`**:
  ```javascript
  function combineAddressLines(addressData, prefix) {
    const parts = [];
    for (let i = 1; i <= 4; i++) {
      const fieldName = `${prefix}_Line_${i}`;
      if (hasValue(addressData[fieldName])) {
        parts.push(addressData[fieldName].toString());
      }
    }
    return parts.length > 0 ? parts.join(', ') : null;
  }
  ```
  - Usage: `combineAddressLines(clientData, 'CA')` for Correspondence Address
  - Usage: `combineAddressLines(clientData, 'RA')` for Residence Address  
  - Usage: `combineAddressLines(clientData, 'OA')` for Office Address

---

## Loading States & Error Handling (Web Implementation)

### Photo Loading States
- **Loading State**: Show skeleton/spinner while fetching photos
  ```javascript
  const [photoLoading, setPhotoLoading] = useState({
    ktp: false,
    selfie: false
  });
  ```
- **Error State**: Show placeholder image with "No photo available" text
- **Success State**: Display actual photo with click-to-enlarge functionality

### EMI Restructuring Loading States  
- **Loading State**: Show skeleton/spinner in EMI section
  ```javascript
  const [emiLoading, setEmiLoading] = useState(false);
  const [emiData, setEmiData] = useState(null);
  const [hasEmiData, setHasEmiData] = useState(false);
  ```
- **Error Handling**: Silent failure - hide section completely if API fails
- **Empty Data**: Hide section if API returns empty data array

### API Loading Sequence
1. **Primary Data**: Client details (synchronous from props/context)
2. **Photo Data**: Load KTP and Selfie photos in parallel (asynchronous)
3. **EMI Data**: Load EMI restructuring data (asynchronous)

### Error Handling Patterns
```javascript
// Photo API Error Handling
async function loadPhotos(skorUserId) {
  setPhotoLoading({ ktp: true, selfie: true });
  
  try {
    const [ktpResponse, selfieResponse] = await Promise.allSettled([
      fetch(`/api/photos/ktp/${skorUserId}`),
      fetch(`/api/photos/selfie/${skorUserId}`)
    ]);
    
    // Handle KTP photo
    if (ktpResponse.status === 'fulfilled' && ktpResponse.value.ok) {
      const ktpData = await ktpResponse.value.json();
      setPhotoPaths(prev => ({ ...prev, ktp: ktpData.data.photo_url }));
    }
    
    // Handle Selfie photo  
    if (selfieResponse.status === 'fulfilled' && selfieResponse.value.ok) {
      const selfieData = await selfieResponse.value.json();
      setPhotoPaths(prev => ({ ...prev, selfie: selfieData.data.photo_url }));
    }
  } catch (error) {
    console.error('Photo loading error:', error);
    // Don't show error to user, just use placeholders
  } finally {
    setPhotoLoading({ ktp: false, selfie: false });
  }
}

// EMI API Error Handling
async function loadEmiData(clientId) {
  setEmiLoading(true);
  
  try {
    const response = await fetch('https://n8n.skorcard.app/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: clientId })
    });
    
    if (response.ok) {
      const responseData = await response.json();
      if (responseData[0]?.data?.length > 0) {
        setEmiData(responseData[0].data[0]);
        setHasEmiData(true);
      }
    }
  } catch (error) {
    console.error('EMI data loading error:', error);
    // Silent failure - section will be hidden
  } finally {
    setEmiLoading(false);
  }
}
```

---

## Team-Based Access Control Summary

### Skorcard Team Only:
1. **Financial Information**:
   - Last Statement MAD
   - Last Statement TAD  
   - Buy Back Status
   
2. **EMI Restructuring Information** (entire section):
   - Original Due Amount
   - Restructure Due Date
   - Restructure Tenure
   - Current Due Amount
   - Total Paid Amount

### All Teams:
- All other sections and fields are visible to all authenticated users

---

## Complete API Integration Summary for Web Development

### Required APIs:
1. **Client Details API** (Primary data source - assumed to be available in props/context)
2. **KTP Photo API**: `GET /api/photos/ktp/{skorUserId}`
3. **Selfie Photo API**: `GET /api/photos/selfie/{skorUserId}` 
4. **EMI Restructuring API**: `POST https://n8n.skorcard.app/webhook/6894fe90-b82f-48b8-bb16-8397a3b54c32`

### Authentication Requirements:
- All photo APIs require Bearer token authentication
- EMI API appears to be public webhook (no auth required)
- User team information needed for access control (`isSkorCardUser()`)

### Key Implementation Notes:
1. **skorUserId Detection**: Check multiple possible field names in client data:
   - `Skor_User_ID` (primary)
   - `user_ID` (fallback)  
   - `User_ID` (fallback)

2. **Conditional Rendering**: Many sections/fields use `hasValue()` validation

3. **Team-based Security**: Critical financial fields restricted to Skorcard team only

4. **Error Handling**: Photos and EMI data use silent failure (hide on error)

5. **Formatting**: Currency uses Indonesian format (Rp x.xxx.xxx), dates use DD Bulan YYYY

6. **User Actions**: Phone numbers support WhatsApp and call actions, copyable fields use clipboard API