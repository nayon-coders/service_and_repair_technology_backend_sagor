const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../../prisma/schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Quote unquoted defaults on String fields
const stringDefaults = [
  'PAID',
  'UNPAID',
  'CORPORATE',
  'NON_CORPORATE',
  'REPAIR',
  'SERVICE',
  'BOTH',
  'DUE',
  'PARTIAL',
  'CASH',
  'BANK',
  'BKASH',
  'OTHER',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
  'SPARE_PARTS',
  'SERVICE_LABOUR',
  'RETURNABLE',
  'NON_RETURNABLE',
  'RECEIVING',
  'RETURN',
  'DISPATCHED',
  'ACTIVE',
  'INACTIVE',
];

stringDefaults.forEach((val) => {
  const regex = new RegExp(`@default\\(${val}\\)`, 'g');
  content = content.replace(regex, `@default("${val}")`);
});

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Successfully quoted string defaults in backend/prisma/schema.prisma');
