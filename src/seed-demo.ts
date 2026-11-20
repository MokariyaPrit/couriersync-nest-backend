/**
 * Demo sample data for Branch Manager testing.
 * Prerequisite: `npm run seed` (users + states/cities).
 * Re-runnable: clears DEMO-tagged / BM demo rows, then inserts fresh data.
 */
import 'reflect-metadata';
import {
  BookingType,
  InvoiceStatus,
  PaymentMode,
  QuotationServiceType,
  QuotationStatus,
  RateTemplateKind,
} from '@/shared';
import 'dotenv/config';
import { DataSource, In, Like } from 'typeorm';
import { ALL_ENTITIES } from './database/entities';
import { AnjaniBill } from './entities/anjani-bill.entity';
import { City } from './entities/city.entity';
import { Consignment } from './entities/consignment.entity';
import { CourierCompany } from './entities/courier-company.entity';
import { Customer } from './entities/customer.entity';
import { CustomerPayment } from './entities/customer-payment.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceConsignment } from './entities/invoice-consignment.entity';
import { PaymentAllocation } from './entities/payment-allocation.entity';
import { Quotation } from './entities/quotation.entity';
import { QuotationRateRow } from './entities/quotation-rate-row.entity';
import { QuotationRateTemplate } from './entities/quotation-rate-template.entity';
import { Receiver } from './entities/receiver.entity';
import { SenderLocation } from './entities/sender-location.entity';
import { User } from './entities/user.entity';
import { UserCourierCompanyPref } from './entities/user-courier-company-pref.entity';
import { UserRateCity } from './entities/user-rate-city.entity';
import { cityRateColumnId, ROI_RATE_COLUMN_ID } from './rate-columns/rate-column-ids';
import { defaultRateMatrix } from './quotations/default-rate-bands';
import type { RateColumnDef } from './quotations/rate-matrix.types';

const DEMO_NOTES = 'DEMO_SEED';
const CITY_POOL_NAMES = [
  'Mumbai',
  'Delhi',
  'Ahmedabad',
  'Pune',
  'Surat',
  'Bangalore',
  'Chennai',
  'Hyderabad',
  'Jaipur',
  'Indore',
];

const SHARED_COURIERS = [
  'DEMO BlueDart',
  'DEMO DTDC',
  'DEMO Delhivery',
  'DEMO FedEx',
  'DEMO India Post',
];
const PRIVATE_COURIERS = ['DEMO Local Express', 'DEMO City Runner', 'DEMO SameDay'];

const CUSTOMER_NAMES = [
  'Acme Traders',
  'Bright Exports',
  'Cedar Pharma',
  'Delta Logistics Client',
  'Evergreen Fabrics',
  'Frontier Foods',
  'Galaxy Electronics',
  'Horizon Apparel',
  'Indigo Chemicals',
  'Jade Jewels',
  'Kite Stationery',
  'Lotus Ayurveda',
  'Maple Motors',
  'Nova Softwares',
  'Orbit Optics',
  'Prism Plastics',
  'Quantum Tools',
  'Riverbank Grocers',
  'Summit Hardware',
  'Titan Packaging',
  'Umbra Design',
  'Vertex Auto Parts',
  'Willow Textiles',
  'Xenon Batteries',
  'Yellow Leaf Tea',
  'Zenith Spares',
  'Amber Ceramics',
  'Beacon Books',
  'Coral Cosmetics',
  'Drift Footwear',
];

const RECEIVER_NAMES = [
  'Rajesh Kumar',
  'Priya Sharma',
  'Amit Patel',
  'Sneha Reddy',
  'Vikram Singh',
  'Ananya Iyer',
  'Rohit Mehta',
  'Kavita Joshi',
  'Suresh Nair',
  'Meera Desai',
  'Arjun Kapoor',
  'Neha Gupta',
  'Karan Malhotra',
  'Pooja Verma',
  'Sanjay Rao',
  'Divya Menon',
  'Nikhil Shah',
  'Ishita Bose',
  'Manish Agarwal',
  'Ritu Chopra',
  'Deepak Pillai',
  'Shreya Banerjee',
  'Harsh Vardhan',
  'Tanvi Kulkarni',
  'Yash Thakur',
  'Aditi Saxena',
  'Gaurav Bhatt',
  'Nisha Pandey',
  'Varun Sethi',
  'Komal Jain',
  'Abhishek Das',
  'Rhea Fernandes',
  'Mohit Chauhan',
  'Swati Mishra',
  'Pranav Khatri',
  'Lata Krishnan',
  'Imran Sheikh',
  'Jyoti Rawat',
  'Farhan Qureshi',
  'Simran Gill',
];

function pad(n: number, width = 4) {
  return String(n).padStart(width, '0');
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function money(n: number) {
  return n.toFixed(2);
}

function phone(i: number) {
  return `9${String(800000000 + i).slice(0, 9)}`;
}

function fillRates(
  columns: RateColumnDef[],
  base: number,
): Record<string, string> {
  const rates: Record<string, string> = {};
  columns.forEach((col, idx) => {
    rates[col.id] = money(base + idx * 5);
  });
  return rates;
}

async function createDataSource() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432),
    username: process.env.DATABASE_USER || 'courier',
    password: process.env.DATABASE_PASSWORD || 'courier',
    database: process.env.DATABASE_NAME || 'courier_erp',
    entities: ALL_ENTITIES,
    synchronize: false,
  });
  await ds.initialize();
  return ds;
}

async function resolveCityPool(ds: DataSource): Promise<City[]> {
  const citiesRepo = ds.getRepository(City);
  const found: City[] = [];
  for (const name of CITY_POOL_NAMES) {
    const city = await citiesRepo.findOne({
      where: { name, isActive: true },
      relations: { state: true },
    });
    if (city) found.push(city);
  }
  if (found.length >= 3) return found.slice(0, 10);

  const fallback = await citiesRepo.find({
    where: { isActive: true },
    relations: { state: true },
    take: 10,
    order: { id: 'ASC' },
  });
  if (!fallback.length) {
    throw new Error(
      'No cities in DB. Run `npm run seed` first to load states/cities.',
    );
  }
  return fallback;
}

async function clearDemoData(ds: DataSource, bmId: string) {
  const paymentsRepo = ds.getRepository(CustomerPayment);
  const allocRepo = ds.getRepository(PaymentAllocation);
  const invoicesRepo = ds.getRepository(Invoice);
  const invConsRepo = ds.getRepository(InvoiceConsignment);
  const consignRepo = ds.getRepository(Consignment);
  const quotationsRepo = ds.getRepository(Quotation);
  const templatesRepo = ds.getRepository(QuotationRateTemplate);
  const rowsRepo = ds.getRepository(QuotationRateRow);
  const customersRepo = ds.getRepository(Customer);
  const receiversRepo = ds.getRepository(Receiver);
  const senderRepo = ds.getRepository(SenderLocation);
  const rateCitiesRepo = ds.getRepository(UserRateCity);
  const courierRepo = ds.getRepository(CourierCompany);
  const prefsRepo = ds.getRepository(UserCourierCompanyPref);
  const anjaniRepo = ds.getRepository(AnjaniBill);

  const demoPayments = await paymentsRepo.find({
    where: [
      { createdById: bmId, notes: DEMO_NOTES },
      { createdById: bmId, referenceNo: Like('DEMO-PAY-%') },
    ],
  });
  const paymentIds = demoPayments.map((p) => p.id);
  if (paymentIds.length) {
    await allocRepo.delete({ paymentId: In(paymentIds) });
    await paymentsRepo.delete({ id: In(paymentIds) });
  }

  const demoInvoices = await invoicesRepo.find({
    where: { createdById: bmId, invoiceNumber: Like('INV-DEMO-%') },
    withDeleted: true,
  });
  const invoiceIds = demoInvoices.map((i) => i.id);
  if (invoiceIds.length) {
    await allocRepo
      .createQueryBuilder()
      .delete()
      .where('invoiceId IN (:...ids)', { ids: invoiceIds })
      .execute();
    await invConsRepo.delete({ invoiceId: In(invoiceIds) });
    await invoicesRepo.delete({ id: In(invoiceIds) });
  }

  const demoConsignments = await consignRepo.find({
    where: { createdById: bmId, awb: Like('CS-DEMO-%') },
    withDeleted: true,
  });
  const consignmentIds = demoConsignments.map((c) => c.id);
  if (consignmentIds.length) {
    await invConsRepo.delete({ consignmentId: In(consignmentIds) });
    await consignRepo.delete({ id: In(consignmentIds) });
  }

  const demoQuotations = await quotationsRepo.find({
    where: { createdById: bmId, quotationCode: Like('QT-DEMO-%') },
    withDeleted: true,
  });
  if (demoQuotations.length) {
    await quotationsRepo.delete({ id: In(demoQuotations.map((q) => q.id)) });
  }

  const demoTemplates = await templatesRepo.find({
    where: { createdById: bmId, name: Like('DEMO %') },
    withDeleted: true,
  });
  const templateIds = demoTemplates.map((t) => t.id);
  if (templateIds.length) {
    await rowsRepo.delete({ templateId: In(templateIds) });
    await templatesRepo.delete({ id: In(templateIds) });
  }

  // Demo owns BM sender locations + rate cities for re-seed
  await senderRepo.delete({ createdById: bmId });
  await rateCitiesRepo.delete({ createdById: bmId });

  const demoCustomers = await customersRepo.find({
    where: { createdById: bmId, notes: DEMO_NOTES },
    withDeleted: true,
  });
  if (demoCustomers.length) {
    await customersRepo.delete({ id: In(demoCustomers.map((c) => c.id)) });
  }

  const demoReceivers = await receiversRepo.find({
    where: { createdById: bmId, notes: DEMO_NOTES },
    withDeleted: true,
  });
  if (demoReceivers.length) {
    await receiversRepo.delete({ id: In(demoReceivers.map((r) => r.id)) });
  }

  const demoCouriers = await courierRepo.find({
    where: { name: Like('DEMO %') },
    withDeleted: true,
  });
  const courierIds = demoCouriers.map((c) => c.id);
  if (courierIds.length) {
    await prefsRepo.delete({ courierCompanyId: In(courierIds) });
    await courierRepo.delete({ id: In(courierIds) });
  }

  const demoAnjani = await anjaniRepo.find({
    where: { createdById: bmId, billNo: Like('DEMO-AB-%') },
    withDeleted: true,
  });
  if (demoAnjani.length) {
    await anjaniRepo.delete({ id: In(demoAnjani.map((a) => a.id)) });
  }

  console.log('Cleared previous DEMO rows');
}

async function run() {
  const ds = await createDataSource();

  try {
    const bmEmail = (
      process.env.SEED_BM_EMAIL || 'manager@courier.local'
    ).toLowerCase();
    const bm = await ds.getRepository(User).findOne({ where: { email: bmEmail } });
    if (!bm) {
      throw new Error(
        `Branch manager ${bmEmail} not found. Run \`npm run seed\` first.`,
      );
    }
    const bmId = bm.id;
    const cities = await resolveCityPool(ds);

    await clearDemoData(ds, bmId);

    const courierRepo = ds.getRepository(CourierCompany);
    const prefsRepo = ds.getRepository(UserCourierCompanyPref);
    const customersRepo = ds.getRepository(Customer);
    const receiversRepo = ds.getRepository(Receiver);
    const senderRepo = ds.getRepository(SenderLocation);
    const rateCitiesRepo = ds.getRepository(UserRateCity);
    const templatesRepo = ds.getRepository(QuotationRateTemplate);
    const rowsRepo = ds.getRepository(QuotationRateRow);
    const quotationsRepo = ds.getRepository(Quotation);
    const consignRepo = ds.getRepository(Consignment);
    const invoicesRepo = ds.getRepository(Invoice);
    const invConsRepo = ds.getRepository(InvoiceConsignment);
    const paymentsRepo = ds.getRepository(CustomerPayment);
    const allocRepo = ds.getRepository(PaymentAllocation);
    const anjaniRepo = ds.getRepository(AnjaniBill);

    // --- Courier companies (8) ---
    const shared = await courierRepo.save(
      SHARED_COURIERS.map((name) =>
        courierRepo.create({
          name,
          isShared: true,
          isActive: true,
          createdById: null,
          companyLink: null,
        }),
      ),
    );
    const privateCouriers = await courierRepo.save(
      PRIVATE_COURIERS.map((name) =>
        courierRepo.create({
          name,
          isShared: false,
          isActive: true,
          createdById: bmId,
          companyLink: null,
        }),
      ),
    );
    const couriers = [...shared, ...privateCouriers];
    await prefsRepo.save(
      prefsRepo.create({
        userId: bmId,
        courierCompanyId: shared[0].id,
        isDefault: true,
        isHidden: false,
      }),
    );

    // --- Customers (30) ---
    const customers = await customersRepo.save(
      CUSTOMER_NAMES.map((baseName, i) => {
        const city = cities[i % cities.length];
        return customersRepo.create({
          name: `Demo ${baseName}`,
          primaryPhone: phone(i + 1),
          primaryEmail: `demo.customer${pad(i + 1, 2)}@example.local`,
          address: `${100 + i} Industrial Area, ${city.name}`,
          cityId: city.id,
          stateId: city.stateId,
          pincode: String(400000 + i),
          gstin: i % 3 === 0 ? `27AAAAA${pad(i + 1, 4)}A1Z5` : null,
          notes: DEMO_NOTES,
          fuelChargesExtraPercent: '0',
          fovPercent: '0',
          isActive: true,
          createdById: bmId,
        });
      }),
    );

    // --- Receivers (40) ---
    const receivers = await receiversRepo.save(
      RECEIVER_NAMES.map((name, i) => {
        const city = cities[i % cities.length];
        return receiversRepo.create({
          name: `Demo ${name}`,
          phone: phone(200 + i),
          email: `demo.receiver${pad(i + 1, 2)}@example.local`,
          address: `${200 + i} Receiver Lane, ${city.name}`,
          cityId: city.id,
          stateId: city.stateId,
          pincode: String(500000 + i),
          notes: DEMO_NOTES,
          isActive: true,
          createdById: bmId,
        });
      }),
    );

    // --- Sender locations (3) + rate cities (8) ---
    const senderCities = cities.slice(0, 3);
    const senders = await senderRepo.save(
      senderCities.map((city, i) =>
        senderRepo.create({
          cityId: city.id,
          label: city.name,
          stateId: city.stateId,
          rateColumnId: cityRateColumnId(city.id),
          isDefault: i === 0,
          isActive: true,
          createdById: bmId,
        }),
      ),
    );

    const rateCitySource = cities.slice(0, Math.min(8, cities.length));
    await rateCitiesRepo.save(
      rateCitySource.map((city) =>
        rateCitiesRepo.create({
          cityId: city.id,
          label: city.name,
          stateId: city.stateId,
          createdById: bmId,
        }),
      ),
    );

    // --- Rate templates (2) with default bands + sample rates ---
    const geoColumns: RateColumnDef[] = [
      ...rateCitySource.map((c, i) => ({
        id: cityRateColumnId(c.id),
        label: c.name,
        sortOrder: i,
      })),
      { id: ROI_RATE_COLUMN_ID, label: 'ROI (Rest of India)', sortOrder: rateCitySource.length },
    ];
    const matrix = defaultRateMatrix(geoColumns);
    const matrixWithRates = {
      ...matrix,
      rows: matrix.rows.map((row, ri) => ({
        ...row,
        rates: fillRates(matrix.columns, 40 + ri * 3),
      })),
    };

    const quotationTemplate = await templatesRepo.save(
      templatesRepo.create({
        name: 'DEMO Standard Quotation Rates',
        kind: RateTemplateKind.QUOTATION,
        isActive: true,
        createdById: bmId,
        columns: matrixWithRates.columns,
        sections: matrixWithRates.sections,
      }),
    );
    const cashTemplate = await templatesRepo.save(
      templatesRepo.create({
        name: 'DEMO Cash Booking Rates',
        kind: RateTemplateKind.CASH,
        isActive: true,
        createdById: bmId,
        columns: matrixWithRates.columns,
        sections: matrixWithRates.sections,
      }),
    );

    for (const template of [quotationTemplate, cashTemplate]) {
      await rowsRepo.save(
        matrixWithRates.rows.map((row) =>
          rowsRepo.create({
            templateId: template.id,
            sectionId: row.sectionId,
            weightLabel: row.weightLabel,
            weightGrams: row.weightGrams ?? null,
            isAdditional: false,
            sortOrder: row.sortOrder,
            rates: row.rates as Record<string, string>,
          }),
        ),
      );
    }

    // --- Quotations (20) ---
    const quotations = await quotationsRepo.save(
      Array.from({ length: 20 }, (_, i) => {
        const customer = customers[i % customers.length];
        const city = cities[i % cities.length];
        const status =
          i % 3 === 0 ? QuotationStatus.DRAFT : QuotationStatus.ISSUED;
        return quotationsRepo.create({
          quotationCode: `QT-DEMO-${pad(i + 1)}`,
          customerId: customer.id,
          templateId: quotationTemplate.id,
          createdById: bmId,
          quotationDate: isoDate(daysAgo(40 - i)),
          status,
          notes: DEMO_NOTES,
          snapshot: {
            fuelChargesExtraPercent: '0',
            fovPercent: '0',
            customerName: customer.name,
            customerAddress: customer.address,
            customerCity: city.name,
            customerState: city.state?.name ?? null,
            customerPincode: customer.pincode,
            customerPhone: customer.primaryPhone,
            customerEmail: customer.primaryEmail,
            columns: matrixWithRates.columns,
            sections: matrixWithRates.sections,
            rows: matrixWithRates.rows,
          },
        });
      }),
    );

    // --- Consignments (50): 30 ACCOUNT + 20 CASH ---
    const consignments: Consignment[] = [];
    for (let i = 0; i < 50; i++) {
      const isAccount = i < 30;
      const customer = customers[i % customers.length];
      const receiver = receivers[i % receivers.length];
      const sender = senders[i % senders.length];
      const courier = couriers[i % couriers.length];
      const destCity = cities[(i + 2) % cities.length];
      const basePrice = 200 + (i % 15) * 35;
      const cgst = Math.round(basePrice * 0.09 * 100) / 100;
      const sgst = cgst;
      const price = Math.round((basePrice + cgst + sgst) * 100) / 100;
      const bookingDate = isoDate(daysAgo(55 - i));

      consignments.push(
        consignRepo.create({
          awb: `CS-DEMO-${pad(i + 1)}`,
          bookingType: isAccount ? BookingType.ACCOUNT : BookingType.CASH,
          rateSectionId:
            i % 2 === 0 ? QuotationServiceType.DOX : QuotationServiceType.PARCEL,
          rateColumnId: cityRateColumnId(destCity.id),
          bookingDate,
          partyName: isAccount ? null : `Cash Party ${i + 1}`,
          partyPhone: isAccount ? null : phone(400 + i),
          partyAddress: isAccount ? null : `${i} Cash Street`,
          partyCity: isAccount ? null : destCity.name,
          partyState: isAccount ? null : destCity.state?.name ?? null,
          partyPincode: isAccount ? null : String(600000 + i),
          customerId: isAccount ? customer.id : null,
          courierCompanyId: courier.id,
          quotationId: isAccount ? quotations[i % quotations.length].id : null,
          senderLocationId: sender.id,
          receiverId: receiver.id,
          senderName: isAccount ? customer.name : `Cash Party ${i + 1}`,
          senderPhone: isAccount ? customer.primaryPhone : phone(400 + i),
          senderAddress: isAccount
            ? customer.address
            : `${i} Cash Street`,
          receiverName: receiver.name,
          receiverPhone: receiver.phone,
          receiverAddress: receiver.address,
          receiverCity: destCity.name,
          receiverState: destCity.state?.name ?? null,
          receiverPincode: receiver.pincode,
          receiverCityId: destCity.id,
          receiverStateId: destCity.stateId,
          weightKg: money(0.5 + (i % 10) * 0.25),
          basePrice: money(basePrice),
          cgst: money(cgst),
          sgst: money(sgst),
          igst: money(0),
          price: money(price),
          createdById: bmId,
          remarks: DEMO_NOTES,
        }),
      );
    }
    const savedConsignments = await consignRepo.save(consignments);

    // --- Invoices (20) + unique consignment links + coherent payments ---
    // Partition ACCOUNT consignments so each is billed at most once
    const accountCons = savedConsignments.filter(
      (c) => c.bookingType === BookingType.ACCOUNT && c.customerId,
    );
    const unusedAccount = [...accountCons];
    const invoices: Invoice[] = [];
    const invoiceLinks: { invoiceIndex: number; consignmentIds: string[] }[] =
      [];

    for (let i = 0; i < 20; i++) {
      const takeCount = 1 + (i % 3); // 1–3
      const chosen: Consignment[] = [];
      // Prefer consignments for customers[i % 5]
      const preferredCustomerId = customers[i % 5].id;
      for (let t = 0; t < takeCount; t++) {
        const idx = unusedAccount.findIndex(
          (c) => c.customerId === preferredCustomerId,
        );
        const pickIdx = idx >= 0 ? idx : unusedAccount.length ? 0 : -1;
        if (pickIdx < 0) break;
        chosen.push(unusedAccount.splice(pickIdx, 1)[0]);
      }
      if (!chosen.length && unusedAccount.length) {
        chosen.push(unusedAccount.shift()!);
      }

      const customerId = chosen[0]?.customerId ?? customers[i % 5].id;
      const gross = chosen.length
        ? chosen.reduce((sum, c) => sum + Number(c.basePrice), 0)
        : 500 + i * 50;
      const fuel = Math.round(gross * 0.05 * 100) / 100;
      const sub = Math.round((gross + fuel) * 100) / 100;
      const cgstAmt = Math.round(sub * 0.09 * 100) / 100;
      const sgstAmt = cgstAmt;
      const total = Math.round((sub + cgstAmt + sgstAmt) * 100) / 100;

      // Settlement pattern: unpaid / partial / paid
      let amountPaid = 0;
      let status = InvoiceStatus.ISSUED;
      if (i % 3 === 2) {
        amountPaid = total;
        status = InvoiceStatus.PAID;
      } else if (i % 3 === 1) {
        amountPaid = Math.round(total * 0.4 * 100) / 100;
      }

      invoices.push(
        invoicesRepo.create({
          invoiceNumber: `INV-DEMO-${pad(i + 1)}`,
          customerId,
          status,
          billDate: isoDate(daysAgo(30 - i)),
          periodStart: isoDate(daysAgo(45 - i)),
          periodEnd: isoDate(daysAgo(31 - i)),
          grossAmount: money(gross),
          fuelSurcharge: money(fuel),
          subTotal: money(sub),
          cgstPercent: '9',
          sgstPercent: '9',
          igstPercent: '0',
          cgstAmount: money(cgstAmt),
          sgstAmount: money(sgstAmt),
          igstAmount: '0.00',
          roundOffAmount: '0.00',
          totalAmount: money(total),
          amountPaid: money(amountPaid),
          notes: DEMO_NOTES,
          createdById: bmId,
        }),
      );
      invoiceLinks.push({
        invoiceIndex: i,
        consignmentIds: chosen.map((c) => c.id),
      });
    }

    const savedInvoices = await invoicesRepo.save(invoices);

    const linkedConsignmentIds = new Set<string>();
    const uniqueLinks: InvoiceConsignment[] = [];
    for (const link of invoiceLinks) {
      let sortOrder = 0;
      for (const consignmentId of link.consignmentIds) {
        if (linkedConsignmentIds.has(consignmentId)) continue;
        linkedConsignmentIds.add(consignmentId);
        uniqueLinks.push(
          invConsRepo.create({
            invoiceId: savedInvoices[link.invoiceIndex].id,
            consignmentId,
            sortOrder: sortOrder++,
          }),
        );
      }
    }
    await invConsRepo.save(uniqueLinks);

    // --- Payments (15) + allocations matching invoice.amountPaid ---
    const modes = Object.values(PaymentMode);
    let allocCount = 0;
    let paymentSeq = 0;

    for (let i = 0; i < savedInvoices.length && paymentSeq < 15; i++) {
      const invoice = savedInvoices[i];
      const targetPaid = Number(invoice.amountPaid);
      if (targetPaid <= 0) continue;

      const chunks =
        targetPaid > 400 && paymentSeq < 12
          ? [
              Math.round(targetPaid * 0.6 * 100) / 100,
              Math.round((targetPaid - Math.round(targetPaid * 0.6 * 100) / 100) * 100) /
                100,
            ]
          : [targetPaid];

      for (let c = 0; c < chunks.length && paymentSeq < 15; c++) {
        if (chunks[c] <= 0) continue;
        paymentSeq += 1;
        const payment = await paymentsRepo.save(
          paymentsRepo.create({
            customerId: invoice.customerId,
            paymentDate: isoDate(daysAgo(18 - i - c)),
            amount: money(chunks[c]),
            mode: modes[(paymentSeq - 1) % modes.length],
            referenceNo: `DEMO-PAY-${pad(paymentSeq)}`,
            notes: DEMO_NOTES,
            createdById: bmId,
          }),
        );
        await allocRepo.save(
          allocRepo.create({
            paymentId: payment.id,
            invoiceId: invoice.id,
            amount: money(chunks[c]),
          }),
        );
        allocCount += 1;
      }
    }

    // Top up to 15 payments on remaining unpaid invoices (partial settle)
    for (let i = 0; paymentSeq < 15 && i < savedInvoices.length; i++) {
      const invoice = savedInvoices[i];
      const remaining =
        Number(invoice.totalAmount) - Number(invoice.amountPaid);
      if (remaining < 1) continue;
      const payAmt = Math.round(Math.min(remaining * 0.3, remaining) * 100) / 100;
      paymentSeq += 1;
      const payment = await paymentsRepo.save(
        paymentsRepo.create({
          customerId: invoice.customerId,
          paymentDate: isoDate(daysAgo(8 - (i % 8))),
          amount: money(payAmt),
          mode: modes[(paymentSeq - 1) % modes.length],
          referenceNo: `DEMO-PAY-${pad(paymentSeq)}`,
          notes: DEMO_NOTES,
          createdById: bmId,
        }),
      );
      await allocRepo.save(
        allocRepo.create({
          paymentId: payment.id,
          invoiceId: invoice.id,
          amount: money(payAmt),
        }),
      );
      invoice.amountPaid = money(Number(invoice.amountPaid) + payAmt);
      if (Number(invoice.amountPaid) >= Number(invoice.totalAmount) - 0.01) {
        invoice.amountPaid = invoice.totalAmount;
        invoice.status = InvoiceStatus.PAID;
      }
      await invoicesRepo.save(invoice);
      allocCount += 1;
    }

    // --- Anjani bills (5) ---
    await anjaniRepo.save(
      Array.from({ length: 5 }, (_, i) => {
        const rows = [
          {
            date: isoDate(daysAgo(25 - i)),
            docNo: `D-${pad(i + 1, 3)}`,
            type: 'DOX',
            party: customers[i].name,
            center: cities[i % cities.length].name,
            weight: '0.500',
            unit: 'kg',
            amount: money(250 + i * 40),
          },
          {
            date: isoDate(daysAgo(24 - i)),
            docNo: `D-${pad(i + 11, 3)}`,
            type: 'PARCEL',
            party: customers[i + 1].name,
            center: cities[(i + 1) % cities.length].name,
            weight: '1.200',
            unit: 'kg',
            amount: money(480 + i * 55),
          },
        ];
        const gross = rows.reduce((s, r) => s + Number(r.amount), 0);
        const fuel = Math.round(gross * 0.1 * 100) / 100;
        const sub = gross + fuel;
        const tax = Math.round(sub * 0.09 * 100) / 100;
        const bill = sub + tax * 2;
        return anjaniRepo.create({
          createdById: bmId,
          billNo: `DEMO-AB-${pad(i + 1)}`,
          billDate: isoDate(daysAgo(20 - i)),
          billPeriod: `${isoDate(daysAgo(35 - i))} to ${isoDate(daysAgo(20 - i))}`,
          hsn: '996812',
          customerName: customers[i].name,
          address1: customers[i].address,
          customerGst: customers[i].gstin,
          customerCode: `C${pad(i + 1, 3)}`,
          rows,
          fuel: money(fuel),
          gross: money(gross),
          sub: money(sub),
          sgst: money(tax),
          cgst: money(tax),
          igst: '0.00',
          bill: money(bill),
          words: `Rupees ${Math.round(bill)} only`,
        });
      }),
    );

    const finalPayments = await paymentsRepo.count({
      where: { createdById: bmId, notes: DEMO_NOTES },
    });
    const finalAllocs = await allocRepo
      .createQueryBuilder('a')
      .innerJoin('a.payment', 'p')
      .where('p.createdById = :bmId', { bmId })
      .andWhere('p.notes = :notes', { notes: DEMO_NOTES })
      .getCount();

    console.log('Demo seed complete');
    console.log(`  Courier companies: ${couriers.length}`);
    console.log(`  Customers:          ${customers.length}`);
    console.log(`  Receivers:          ${receivers.length}`);
    console.log(`  Sender locations:   ${senders.length}`);
    console.log(`  Rate cities:        ${rateCitySource.length}`);
    console.log(`  Rate templates:     2`);
    console.log(`  Quotations:         ${quotations.length}`);
    console.log(`  Consignments:       ${savedConsignments.length}`);
    console.log(`  Invoices:           ${savedInvoices.length}`);
    console.log(`  Invoice links:      ${uniqueLinks.length}`);
    console.log(`  Payments:           ${finalPayments}`);
    console.log(`  Allocations:        ${finalAllocs} (built ~${allocCount})`);
    console.log(`  Anjani bills:       5`);
    console.log(`Login as ${bmEmail} / Manager@12345 to see the data`);
  } finally {
    await ds.destroy();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
