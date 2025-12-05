// Utility functions for client details display

export const ClientDisplayUtils = {
  // Data validation functions
  hasValue: (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string' && (
      value === '' || 
      value.toLowerCase() === 'null' || 
      value.toLowerCase() === 'na'
    )) return false;
    if (typeof value === 'boolean' && !value) return false;
    return true;
  },

  safeStringValue: (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    return value.toString();
  },

  // Formatting functions
  formatCurrency: (value: any): string => {
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
  },

  formatDate: (value: any): string => {
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
  },

  // Access control functions
  isSkorCardUser: (userTeam?: string): boolean => {
    return userTeam ? userTeam.toLowerCase().includes('skorcard') : false;
  },

  // Address combination logic
  combineAddressLines: (addressData: any, prefix: string): string | null => {
    const parts = [];
    for (let i = 1; i <= 4; i++) {
      const fieldName = `${prefix}_Line_${i}`;
      if (ClientDisplayUtils.hasValue(addressData[fieldName])) {
        parts.push(addressData[fieldName].toString());
      }
    }
    return parts.length > 0 ? parts.join(', ') : null;
  },

  // Phone action handlers
  openWhatsApp: (phone: string): void => {
    // Format phone for WhatsApp (remove leading 0, add 62)
    let formattedPhone = phone.replace(/[^\d]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }
    
    const url = `https://wa.me/${formattedPhone}`;
    window.open(url, '_blank');
  },

  makePhoneCall: (phone: string): void => {
    const url = `tel:${phone}`;
    window.location.href = url;
  },

  // Copy to clipboard function
  copyToClipboard: async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      // You can integrate with your notification system here
      console.log(`${label} copied to clipboard`);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log(`${label} copied to clipboard`);
    }
  },

  // Get Skor User ID from various possible fields
  getSkorUserId: (clientData: any): string | null => {
    return clientData?.Skor_User_ID || 
           clientData?.user_ID || 
           clientData?.User_ID || 
           null;
  },

  // Get client display name
  getClientDisplayName: (client: any): string => {
    return client?.Full_Name || client?.Name1 || client?.Last_Name || 'Unknown Client';
  }
};