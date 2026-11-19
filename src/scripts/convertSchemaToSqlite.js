const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Change provider
content = content.replace(/provider\s*=\s*"mysql"/g, 'provider = "sqlite"');

// 2. Remove all enum blocks
content = content.replace(/enum\s+\w+\s*\{[\s\S]*?\}/g, '');

// 3. Replace enum references with String
const enums = [
  'RoleType',
  'PaymentStatus',
  'BillType',
  'CustomerType',
  'VoucherPaymentStatus',
  'VoucherPaymentMethod',
  'RequisitionItemCategory',
  'RequisitionStatus',
  'GatePassType',
  'ChallanKind',
  'GatePassStatus',
  'TaDaStatus',
  'RentPaymentStatus',
  'EmployeeStatus',
  'SalaryPaymentStatus',
];

enums.forEach((enumName) => {
  // Replace type declaration with String, keeping optional ?
  const regexOptional = new RegExp(`\\b${enumName}\\?`, 'g');
  const regexRequired = new RegExp(`\\b${enumName}\\b`, 'g');
  content = content.replace(regexOptional, 'String?');
  content = content.replace(regexRequired, 'String');
});

// 4. Remove all @db.* annotations
content = content.replace(/@db\.\w+(\([^)]*\))?/g, '');

// Clean up any extra empty lines
content = content.replace(/\n{3,}/g, '\n\n');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Successfully converted backend/prisma/schema.prisma to SQLite format');
