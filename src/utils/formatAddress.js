// Normalize address field for display. Accepts string or object.
const formatAddress = (addr) => {
  if (!addr && addr !== 0) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [];
    const push = (v) => { if (v || v === 0) parts.push(String(v).trim()); };
    // Common address shape
    push(addr.houseNo);
    push(addr.street);
    push(addr.subdivision);
    push(addr.barangay);
    push(addr.city);
    push(addr.province);
    push(addr.zipCode || addr.zip);
    // Fallback: if object has a single-line `full` or `line` property
    if (parts.length === 0) {
      if (addr.full) return String(addr.full);
      if (addr.line) return String(addr.line);
    }
    return parts.join(', ');
  }
  // Anything else — coerce to string
  return String(addr);
};

export default formatAddress;
