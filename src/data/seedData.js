// Pre-seeded database initialized directly from original hms.sql & hms .sql dumps

export const initialSeedData = {
  admin: [
    { id: 1, username: 'Ashwin', email: 'hashwin381@gmail.com', role: 'Administrator', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' }
  ],
  members: [
    { id: 1, username: 'Frederick J Baker', email: 'baker@gmail.com', phone: '7450002145', flat: 'A-101', address: '1488 Franklin Street', status: 'Owner', created_at: '2022-05-12' },
    { id: 2, username: 'Antonio Dominguez', email: 'antonio@gmail.com', phone: '7854547855', flat: 'A-102', address: '3961 Sycamore Lake Road', status: 'Owner', created_at: '2022-05-12' },
    { id: 3, username: 'Etta H Abner', email: 'etta@gmail.com', phone: '7012569980', flat: 'B-201', address: '3255 Ocello Street', status: 'Tenant', created_at: '2022-05-13' },
    { id: 4, username: 'Jeffrey Wegman', email: 'wegman@gmail.com', phone: '7012458888', flat: 'B-202', address: '2962 Pine Tree Lane', status: 'Owner', created_at: '2022-05-14' },
    { id: 5, username: 'Benjamin Sanderson', email: 'benjamin@gmail.com', phone: '7012565800', flat: 'C-301', address: '4830 Bell Street', status: 'Owner', created_at: '2022-05-15' },
    { id: 6, username: 'Eric Webb', email: 'ericw@gmail.com', phone: '7896541000', flat: 'C-302', address: '3485 Stewart Street', status: 'Tenant', created_at: '2022-05-16' },
    { id: 7, username: 'Jonathan Lasalle', email: 'jonathan@gmail.com', phone: '7014585002', flat: 'D-401', address: '3850 Olen Thomas Drive', status: 'Owner', created_at: '2022-05-17' },
    { id: 8, username: 'Liam Moore', email: 'liamoore@gmail.com', phone: '7012545555', flat: 'D-402', address: '744 Ralph Street', status: 'Owner', created_at: '2022-05-18' },
    { id: 9, username: 'Will Williams', email: 'williams@gmail.com', phone: '7696969855', flat: 'E-501', address: '7855 Allace Avenue', status: 'Tenant', created_at: '2022-05-19' },
    { id: 10, username: 'Christine Moore', email: 'moore@gmail.com', phone: '7896500010', flat: 'E-502', address: '1458 Bleckstreet', status: 'Owner', created_at: '2022-05-20' },
    { id: 11, username: 'Timothy Diaz', email: 'timothy@gmail.com', phone: '7412580020', flat: 'F-601', address: '4840 Oakdale Avenue', status: 'Owner', created_at: '2022-05-21' }
  ],
  staff: [
    { id: 1, username: 'Baburao', email: 'baburao@gmail.com', phone: '9876543210', role: 'Head Security Guard', shift: 'Day (8 AM - 8 PM)', created_at: '2022-05-12' },
    { id: 2, username: 'Ram', email: 'ram@gmail.com', phone: '9876543211', role: 'Night Supervisor', shift: 'Night (8 PM - 8 AM)', created_at: '2022-05-12' },
    { id: 3, username: 'Suresh Kumar', email: 'suresh@gatesync.com', phone: '9812345678', role: 'Maintenance Technician', shift: 'General (9 AM - 6 PM)', created_at: '2023-01-10' },
    { id: 4, username: 'Rajesh Sharma', email: 'rajesh@gatesync.com', phone: '9823456789', role: 'Landscape Supervisor', shift: 'Morning (7 AM - 3 PM)', created_at: '2023-02-15' }
  ],
  billing: [
    {
      id: 1,
      invoice: 'INV-2024-001',
      billing_date: '2024-09-01',
      due_date: '2024-09-15',
      member_id: 1,
      member_name: 'Frederick J Baker',
      flat: 'A-101',
      status: 1, // 1 = Paid
      total_amount: 9500,
      amount_payed: 9500,
      amount_change: 0,
      payment_method: 'UPI Online',
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: 5000, amount: 5000 },
        { type: 'Electricity Unit Charge', reading: 300, prev_reading: 200, rate: 15, amount: 1500 },
        { type: 'Water Utility Charge', reading: 600, prev_reading: 300, rate: 10, amount: 3000 }
      ]
    },
    {
      id: 2,
      invoice: 'INV-2024-002',
      billing_date: '2024-09-01',
      due_date: '2024-09-15',
      member_id: 2,
      member_name: 'Antonio Dominguez',
      flat: 'A-102',
      status: 1, // 1 = Paid
      total_amount: 8500,
      amount_payed: 10000,
      amount_change: 1500,
      payment_method: 'Credit Card',
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: 3000, amount: 3000 },
        { type: 'Electricity Unit Charge', reading: 300, prev_reading: 0, rate: 15, amount: 4500 },
        { type: 'Water Utility Charge', reading: 100, prev_reading: 0, rate: 10, amount: 1000 }
      ]
    },
    {
      id: 3,
      invoice: 'INV-2024-003',
      billing_date: '2024-09-10',
      due_date: '2024-09-25',
      member_id: 3,
      member_name: 'Etta H Abner',
      flat: 'B-201',
      status: 0, // 0 = Pending
      total_amount: 8000,
      amount_payed: 0,
      amount_change: 0,
      payment_method: null,
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: 5000, amount: 5000 },
        { type: 'Electricity Unit Charge', reading: 200, prev_reading: 100, rate: 15, amount: 1500 },
        { type: 'Water Utility Charge', reading: 450, prev_reading: 300, rate: 10, amount: 1500 }
      ]
    },
    {
      id: 4,
      invoice: 'INV-2024-004',
      billing_date: '2024-09-12',
      due_date: '2024-09-28',
      member_id: 4,
      member_name: 'Jeffrey Wegman',
      flat: 'B-202',
      status: 0, // 0 = Pending
      total_amount: 6500,
      amount_payed: 0,
      amount_change: 0,
      payment_method: null,
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: 3000, amount: 3000 },
        { type: 'Electricity Unit Charge', reading: 400, prev_reading: 300, rate: 15, amount: 1500 },
        { type: 'Water Utility Charge', reading: 300, prev_reading: 100, rate: 10, amount: 2000 }
      ]
    },
    {
      id: 5,
      invoice: 'INV-2024-005',
      billing_date: '2024-09-15',
      due_date: '2024-09-30',
      member_id: 5,
      member_name: 'Benjamin Sanderson',
      flat: 'C-301',
      status: 0, // 0 = Pending
      total_amount: 7200,
      amount_payed: 0,
      amount_change: 0,
      payment_method: null,
      breakdown: [
        { type: 'Block Maintenance', reading: 0, prev_reading: 0, rate: 4000, amount: 4000 },
        { type: 'Electricity Unit Charge', reading: 220, prev_reading: 100, rate: 15, amount: 1800 },
        { type: 'Water Utility Charge', reading: 260, prev_reading: 120, rate: 10, amount: 1400 }
      ]
    }
  ],
  announcements: [
    {
      announcement_id: 75,
      announcement_subject: 'Urgent Water Supply Interruption',
      announcement_text: 'Dear Residents, overhead water tank cleaning and pipe maintenance will take place this Thursday from 10:00 AM to 4:00 PM. Please store sufficient water.',
      announcement_status: 1, // Active
      category: 'Urgent',
      created_at: '2024-09-20'
    },
    {
      announcement_id: 76,
      announcement_subject: 'Annual GateSync Society General Body Meeting (AGM)',
      announcement_text: 'The Annual General Body meeting is scheduled for coming Sunday at 5:00 PM in the GateSync Clubhouse. Agenda includes financial audit approval & green solar installation proposal.',
      announcement_status: 1, // Active
      category: 'General',
      created_at: '2024-09-22'
    },
    {
      announcement_id: 77,
      announcement_subject: 'Festival Celebration & Cultural Fest',
      announcement_text: 'Get ready for our annual Autumn Cultural Festival! Registrations for kids dance performance & talent show are now open at the management office.',
      announcement_status: 1, // Active
      category: 'Event',
      created_at: '2024-09-25'
    }
  ],
  registry: [
    { id: 1, person_name: 'Ramesh Patel (Swiggy Delivery)', flat: 'A-101', purpose: 'Food Delivery', phone: '9876112233', status: 'Checked Out', in_time: '2024-09-26 10:32 AM', out_time: '2024-09-26 10:45 AM', created_at: '2024-09-26 10:32 AM' },
    { id: 2, person_name: 'Jayesh Varma (Plumber)', flat: 'B-201', purpose: 'Maintenance Repair', phone: '9811223344', status: 'Checked Out', in_time: '2024-09-26 11:15 AM', out_time: '2024-09-26 01:20 PM', created_at: '2024-09-26 11:15 AM' },
    { id: 3, person_name: 'Sunil Rao (Amazon Logistics)', flat: 'C-302', purpose: 'Parcel Delivery', phone: '9765432100', status: 'Inside', in_time: '2024-09-27 09:40 AM', out_time: '-', created_at: '2024-09-27 09:40 AM' },
    { id: 4, person_name: 'Dr. Meena Iyer (Guest)', flat: 'A-102', purpose: 'Personal Visit', phone: '9822334455', status: 'Inside', in_time: '2024-09-27 10:15 AM', out_time: '-', created_at: '2024-09-27 10:15 AM' }
  ],
  home_services: [
    { id: 1, category: 'Electrical Work', name: 'QuickFix Electricals', person: 'Mahesh Kumar', phone: '9819001122', rating: 4.9, experience: '8 Years', rate: '₹350 / visit' },
    { id: 2, category: 'Plumbing', name: 'AquaFlow Plumbing', person: 'Sanjay Shinde', phone: '9820002233', rating: 4.8, experience: '12 Years', rate: '₹300 / visit' },
    { id: 3, category: 'Carpentry & Woodwork', name: 'WoodCraft Studio', person: 'Vikas Sharma', phone: '9830003344', rating: 4.7, experience: '10 Years', rate: '₹400 / visit' },
    { id: 4, category: 'Appliance Repair', name: 'CoolCare AC & Fridge Service', person: 'Anand Patil', phone: '9840004455', rating: 4.9, experience: '6 Years', rate: '₹500 / visit' },
    { id: 5, category: 'Pest Control', name: 'ShieldGuard Pest Control', person: 'Ravi Verma', phone: '9850005566', rating: 4.6, experience: '15 Years', rate: '₹800 / service' },
    { id: 6, category: 'House Cleaning', name: 'Sparkle Clean Services', person: 'Sunita Devi', phone: '9860006677', rating: 4.8, experience: '5 Years', rate: '₹600 / service' }
  ],
  events: [
    { id: 1, title: 'Grand Festival Gala & Music Evening', date: '2024-10-05', time: '06:00 PM', location: 'GateSync Central Lawn', rsvp_count: 42, category: 'Cultural', description: 'Join us for a magical evening filled with music, food stalls, games, and cultural performances by our society children.' },
    { id: 2, title: 'Quarterly Resident Assembly (AGM)', date: '2024-10-12', time: '05:00 PM', location: 'Clubhouse Main Hall', rsvp_count: 28, category: 'Meeting', description: 'Quarterly review of society accounts, security enhancements, electric vehicle charging station installation vote.' },
    { id: 3, title: 'Free Health & Wellness Checkup Camp', date: '2024-10-20', time: '09:00 AM - 02:00 PM', location: 'Community Center', rsvp_count: 35, category: 'Health', description: 'Free sugar, BP, eye checkup, and ECG camp organized in partnership with Apollo Health Care.' },
    { id: 4, title: 'Cleanliness & Green Tree Plantation Drive', date: '2024-10-28', time: '07:30 AM', location: 'GateSync Garden & Perimeter', rsvp_count: 50, category: 'Eco Drive', description: 'Planting 100 native trees around society boundary walls. Saplings & tools provided.' }
  ],
  neighborhood: [
    { id: 1, name: 'City Hospital & Emergency Care', category: 'Medical', distance: '1.2 km', phone: '022-2890-0000', address: 'Plot 42, Park Avenue', timing: '24x7 Open' },
    { id: 2, name: 'St. Xavier International School', category: 'Education', distance: '0.8 km', phone: '022-2891-1122', address: 'Main Ring Road', timing: '7:30 AM - 3:30 PM' },
    { id: 3, name: 'DMart Mega Supermarket', category: 'Shopping', distance: '0.5 km', phone: '022-2892-3344', address: 'Commercial Plaza, Sector 4', timing: '8:00 AM - 10:00 PM' },
    { id: 4, name: 'Central Metro Station', category: 'Transport', distance: '0.6 km', phone: '1800-200-300', address: 'Line 2A Metro Station Gate 2', timing: '5:30 AM - 11:30 PM' },
    { id: 5, name: 'Sector 5 Police Precinct', category: 'Safety', distance: '1.8 km', phone: '100 / 022-2893-9999', address: 'Station Road Near Flyover', timing: '24x7 Emergency' },
    { id: 6, name: 'Green Valley Joggers Park', category: 'Recreation', distance: '0.3 km', phone: 'N/A', address: 'Adjacent to GateSync Gate 2', timing: '5:00 AM - 9:00 PM' }
  ]
};
