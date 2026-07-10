import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Full system administrator",
    },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: "editor" },
    update: {},
    create: {
      name: "editor",
      description: "Content editor",
    },
  });

  const permissions = [
    { name: "manage_services", module: "services" },
    { name: "manage_directories", module: "directories" },
    { name: "manage_downloads", module: "downloads" },
    { name: "manage_announcements", module: "announcements" },
    { name: "manage_faqs", module: "faqs" },
    { name: "manage_events", module: "events" },
    { name: "manage_emergency", module: "emergency" },
    { name: "manage_tourism", module: "tourism" },
    { name: "manage_users", module: "users" },
    { name: "manage_settings", module: "settings" },
    { name: "manage_building", module: "building" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@camiguin.gov.ph" },
    update: {},
    create: {
      email: "admin@camiguin.gov.ph",
      password: hashedPassword,
      name: "System Administrator",
      roleId: adminRole.id,
    },
  });

  const settings = [
    { key: "gov_name_en", value: "Provincial Government of Camiguin", group: "branding" },
    { key: "gov_name_fil", value: "Pamahalaang Panlalawigan ng Camiguin", group: "branding" },
    { key: "tagline_en", value: "The Island Born of Fire", group: "branding" },
    { key: "tagline_fil", value: "Ang Pulo na Pinanganakan ng Apoy", group: "branding" },
    { key: "welcome_en", value: "Use this kiosk to find services, offices, forms, and information about Camiguin.", group: "branding" },
    { key: "welcome_fil", value: "Gamitin ang kiosk na ito upang makahanap ng mga serbisyo, opisina, form, at impormasyon tungkol sa Camiguin.", group: "branding" },
    { key: "footer_tagline_en", value: "Connecting People. Building Communities. Developing Camiguin.", group: "branding" },
    { key: "footer_tagline_fil", value: "Pag-uugnay ng mga Tao. Pagbuo ng mga Komunidad. Pag-unlad ng Camiguin.", group: "branding" },
    { key: "office_hours_en", value: "Monday to Friday, 8:00 AM – 5:00 PM", group: "contact" },
    { key: "office_hours_fil", value: "Lunes hanggang Biyernes, 8:00 AM – 5:00 PM", group: "contact" },
    { key: "contact_phone", value: "(088) 387-1001", group: "contact" },
    { key: "contact_email", value: "info@camiguin.gov.ph", group: "contact" },
    { key: "contact_address", value: "Mambajao, Camiguin", group: "contact" },
    { key: "building_floor_plan_uploaded", value: "false", group: "building" },
    { key: "gov_prefix_en", value: "Provincial Government of", group: "branding" },
    { key: "gov_prefix_fil", value: "Pamahalaang Panlalawigan ng", group: "branding" },
    { key: "gov_short_en", value: "CAMIGUIN", group: "branding" },
    { key: "gov_short_fil", value: "CAMIGUIN", group: "branding" },
    { key: "building_name_en", value: "Demo Academic Building", group: "building" },
    { key: "building_name_fil", value: "Demo Academic Building", group: "building" },
    { key: "building_demo_notice_en", value: "This building is currently using demonstration data. Navigation is based on the Demo Academic Building for testing purposes.", group: "building" },
    { key: "building_demo_notice_fil", value: "Gumagamit ng demonstration data ang gusaling ito. Ang navigation ay batay sa Demo Academic Building para sa testing.", group: "building" },
    { key: "building_demo_banner_en", value: "The official building floor plan has not been uploaded yet. Navigation uses the Demo Academic Building for testing.", group: "building" },
    { key: "building_demo_banner_fil", value: "Hindi pa na-upload ang opisyal na floor plan. Gumagamit ng Demo Academic Building ang navigation para sa testing.", group: "building" },
    { key: "building_missing_location_en", value: "I couldn't find that location in the current building directory.\n\nIf the official building floor plan has not yet been uploaded, the system is using demonstration data for testing purposes. Once the official floor plan and directory are available, I will provide accurate navigation based on the real building.", group: "building" },
    { key: "building_missing_location_fil", value: "Hindi ko mahanap ang lokasyong iyon sa kasalukuyang building directory.", group: "building" },
    { key: "building_quick_questions_en", value: JSON.stringify(["Where is the Registrar's Office?", "How do I get to the Library?", "Where is the nearest restroom?", "Where is the Dean's Office?", "Emergency exit"]), group: "building" },
    { key: "building_quick_questions_fil", value: JSON.stringify(["Nasaan ang Registrar's Office?", "Paano pumunta sa Library?", "Nasaan ang pinakamalapit na restroom?", "Nasaan ang Dean's Office?", "Emergency exit"]), group: "building" },
    { key: "building_kiosk_location_id", value: "f1-kiosk", group: "building" },
    { key: "building_kiosk_node_id", value: "f1_kiosk", group: "building" },
    { key: "building_kiosk_x", value: "105", group: "building" },
    { key: "building_kiosk_y", value: "200", group: "building" },
    { key: "building_kiosk_floor", value: "1", group: "building" },
    { key: "building_page_title_en", value: "Building Directory", group: "building" },
    { key: "building_page_title_fil", value: "Direktoryo ng Gusali", group: "building" },
    { key: "building_page_description_en", value: "Find rooms, offices, and facilities with step-by-step indoor navigation.", group: "building" },
    { key: "building_page_description_fil", value: "Hanapin ang mga silid, opisina, at pasilidad na may hakbang-hakbang na indoor navigation.", group: "building" },
    { key: "building_guide_title_en", value: "AI BUILDING GUIDE", group: "building" },
    { key: "building_guide_title_fil", value: "AI BUILDING GUIDE", group: "building" },
    { key: "building_guide_subtitle_en", value: "Ask where a room or facility is — I'll guide you step by step.", group: "building" },
    { key: "building_guide_subtitle_fil", value: "Tanungin kung nasaan ang silid o pasilidad — gagabayan kita nang hakbang-hakbang.", group: "building" },
    { key: "building_guide_placeholder_en", value: 'e.g. "Where is the Registrar\'s Office?"', group: "building" },
    { key: "building_guide_placeholder_fil", value: 'hal. "Nasaan ang Registrar\'s Office?"', group: "building" },
    { key: "building_navigation_graph", value: "", group: "building" },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const quickLinks = [
    { slug: "business-permit", titleEn: "Business Permit", titleFil: "Permit ng Negosyo", icon: "Briefcase", href: "/services/business-permit", sortOrder: 1 },
    { slug: "cedula", titleEn: "Cedula / Community Tax", titleFil: "Cedula / Buwis sa Komunidad", icon: "FileText", href: "/services/cedula", sortOrder: 2 },
    { slug: "barangay-clearance", titleEn: "Barangay Clearance", titleFil: "Barangay Clearance", icon: "Shield", href: "/services/barangay-clearance", sortOrder: 3 },
    { slug: "building-permit", titleEn: "Building Permit", titleFil: "Pahintulot sa Gusali", icon: "Building2", href: "/services/building-permit", sortOrder: 4 },
    { slug: "traffic-mv", titleEn: "Traffic / MV Services", titleFil: "Trapiko / Serbisyo ng MV", icon: "Car", href: "/services/traffic-mv", sortOrder: 5 },
  ];

  for (const link of quickLinks) {
    await prisma.quickLink.upsert({
      where: { slug: link.slug },
      update: link,
      create: link,
    });
  }

  const homepageCards = [
    { slug: "citizens-charter", titleEn: "Citizens' Charter", titleFil: "Citizens' Charter", descriptionEn: "Service standards, processing times, and requirements.", descriptionFil: "Mga pamantayan ng serbisyo, oras ng pagproseso, at mga kinakailangan.", icon: "FileCheck", color: "blue", href: "/citizens-charter", sortOrder: 1 },
    { slug: "building-directory", titleEn: "Building Directory", titleFil: "Direktoryo ng Gusali", descriptionEn: "Find offices and rooms inside the capitol building.", descriptionFil: "Hanapin ang mga opisina at silid sa loob ng capitol building.", icon: "Building", color: "green", href: "/building-directory", sortOrder: 2 },
    { slug: "map", titleEn: "Map of Camiguin", titleFil: "Mapa ng Camiguin", descriptionEn: "Explore municipalities, landmarks, and key locations.", descriptionFil: "Tuklasin ang mga munisipalidad, palatandaan, at mahahalagang lokasyon.", icon: "Map", color: "teal", href: "/map", sortOrder: 3 },
    { slug: "government-directory", titleEn: "Government Directory", titleFil: "Direktoryo ng Pamahalaan", descriptionEn: "Departments, officials, and contact information.", descriptionFil: "Mga departamento, opisyal, at impormasyon sa pakikipag-ugnayan.", icon: "Users", color: "purple", href: "/government-directory", sortOrder: 4 },
    { slug: "news", titleEn: "News & Announcements", titleFil: "Balita at Anunsyo", descriptionEn: "Latest advisories, programs, and public notices.", descriptionFil: "Pinakabagong mga abiso, programa, at pampublikong paunawa.", icon: "Megaphone", color: "orange", href: "/news", sortOrder: 5 },
    { slug: "download-center", titleEn: "Download Center", titleFil: "Sentro ng Pag-download", descriptionEn: "Forms, guidelines, and official documents.", descriptionFil: "Mga form, gabay, at opisyal na dokumento.", icon: "Download", color: "red-orange", href: "/download-center", sortOrder: 6 },
    { slug: "faq", titleEn: "Frequently Asked Questions", titleFil: "Mga Madalas Itanong", descriptionEn: "Quick answers to common service questions.", descriptionFil: "Mabilis na mga sagot sa karaniwang tanong tungkol sa serbisyo.", icon: "HelpCircle", color: "sky", href: "/faq", sortOrder: 7 },
    { slug: "tourism", titleEn: "Tourism Information", titleFil: "Impormasyon sa Turismo", descriptionEn: "Attractions, activities, and travel tips.", descriptionFil: "Mga atraksyon, aktibidad, at mga tip sa paglalakbay.", icon: "Palmtree", color: "pink", href: "/tourism", sortOrder: 8 },
    { slug: "emergency", titleEn: "Emergency Contacts", titleFil: "Mga Contact sa Emergency", descriptionEn: "Hotlines for police, fire, health, and rescue.", descriptionFil: "Mga hotline para sa pulis, bumbero, kalusugan, at rescue.", icon: "Phone", color: "red", href: "/emergency", sortOrder: 9 },
    { slug: "events", titleEn: "Events Calendar", titleFil: "Kalendaryo ng mga Kaganapan", descriptionEn: "Upcoming festivals, meetings, and activities.", descriptionFil: "Mga paparating na festival, pagpupulong, at aktibidad.", icon: "Calendar", color: "violet", href: "/events", sortOrder: 10 },
    { slug: "help", titleEn: "I Need Help With...", titleFil: "Kailangan Ko ng Tulong sa...", descriptionEn: "Guided assistance for common requests.", descriptionFil: "Gabay na tulong para sa mga karaniwang kahilingan.", icon: "Sparkles", color: "amber", href: "/help", sortOrder: 11 },
  ];

  for (const card of homepageCards) {
    await prisma.homepageCard.upsert({
      where: { slug: card.slug },
      update: card,
      create: card,
    });
  }

  const services = [
    {
      slug: "business-permit",
      titleEn: "Business Permit",
      titleFil: "Permit ng Negosyo",
      descriptionEn: "Apply for a new business permit or renew an existing one.",
      descriptionFil: "Mag-apply para sa bagong permit sa negosyo o mag-renew ng umiiral na permit.",
      requirementsEn: "Valid ID, Barangay Clearance, DTI/SEC Registration, Lease Contract",
      requirementsFil: "Valid na ID, Barangay Clearance, DTI/SEC Registration, Lease Contract",
      documentsEn: "Application Form, Sketch of Business Location, Fire Safety Certificate",
      documentsFil: "Application Form, Sketch ng Lokasyon ng Negosyo, Fire Safety Certificate",
      officeLocation: "Business Permits and Licensing Office, Capitol Building, Ground Floor",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "3-5 working days",
      fee: "Varies by business type",
      contactInfo: "(088) 387-1001",
      category: "business",
      icon: "Briefcase",
      color: "blue",
    },
    {
      slug: "cedula",
      titleEn: "Cedula / Community Tax",
      titleFil: "Cedula / Buwis sa Komunidad",
      descriptionEn: "Obtain your community tax certificate (cedula).",
      descriptionFil: "Kumuha ng iyong community tax certificate (cedula).",
      requirementsEn: "Valid ID, Proof of Income (if employed)",
      requirementsFil: "Valid na ID, Patunay ng Kita (kung employed)",
      officeLocation: "Treasurer's Office, Capitol Building",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "Same day",
      fee: "Based on income bracket",
      category: "tax",
      icon: "FileText",
      color: "green",
    },
    {
      slug: "barangay-clearance",
      titleEn: "Barangay Clearance",
      titleFil: "Barangay Clearance",
      descriptionEn: "Request a barangay clearance certificate.",
      descriptionFil: "Humiling ng barangay clearance certificate.",
      requirementsEn: "Valid ID, Proof of Residency",
      requirementsFil: "Valid na ID, Patunay ng Paninirahan",
      officeLocation: "Your respective Barangay Hall",
      processingTime: "1-2 working days",
      fee: "Minimal fee",
      category: "clearance",
      icon: "Shield",
      color: "teal",
    },
    {
      slug: "building-permit",
      titleEn: "Building Permit",
      titleFil: "Pahintulot sa Gusali",
      descriptionEn: "Apply for construction and building permits.",
      descriptionFil: "Mag-apply para sa construction at building permits.",
      requirementsEn: "Lot Title, Building Plans, Structural Design",
      requirementsFil: "Lot Title, Building Plans, Structural Design",
      officeLocation: "Engineering Office, Capitol Building",
      officeHours: "Monday to Friday, 8:00 AM – 5:00 PM",
      processingTime: "10-15 working days",
      category: "permit",
      icon: "Building2",
      color: "purple",
    },
    {
      slug: "traffic-mv",
      titleEn: "Traffic / MV Services",
      titleFil: "Trapiko / Serbisyo ng MV",
      descriptionEn: "Motor vehicle registration and traffic-related services.",
      descriptionFil: "Rehistro ng motor vehicle at mga serbisyo na may kaugnayan sa trapiko.",
      requirementsEn: "Valid ID, OR/CR, Insurance",
      requirementsFil: "Valid na ID, OR/CR, Insurance",
      officeLocation: "LTO Camiguin District Office",
      processingTime: "Same day to 3 days",
      category: "traffic",
      icon: "Car",
      color: "orange",
    },
  ];

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  const directories = [
    { type: "building", nameEn: "Governor's Office", nameFil: "Tanggapan ng Gobernador", floor: "2nd Floor", room: "201", building: "Capitol Building", contactNumber: "(088) 387-1001", sortOrder: 1 },
    { type: "building", nameEn: "Treasurer's Office", nameFil: "Tanggapan ng Ingat-Yaman", floor: "Ground Floor", room: "105", building: "Capitol Building", contactNumber: "(088) 387-1002", sortOrder: 2 },
    { type: "building", nameEn: "Business Permits Office", nameFil: "Tanggapan ng Business Permits", floor: "Ground Floor", room: "108", building: "Capitol Building", contactNumber: "(088) 387-1003", sortOrder: 3 },
    { type: "government", nameEn: "Provincial Health Office", nameFil: "Tanggapan ng Kalusugan ng Lalawigan", department: "Health", headName: "Dr. Maria Santos", contactNumber: "(088) 387-1010", email: "health@camiguin.gov.ph", sortOrder: 1 },
    { type: "government", nameEn: "Provincial Engineering Office", nameFil: "Tanggapan ng Inhinyeriya ng Lalawigan", department: "Infrastructure", headName: "Engr. Juan Dela Cruz", contactNumber: "(088) 387-1011", email: "engineering@camiguin.gov.ph", sortOrder: 2 },
    { type: "government", nameEn: "Provincial Social Welfare Office", nameFil: "Tanggapan ng Social Welfare ng Lalawigan", department: "Social Services", headName: "Ms. Ana Reyes", contactNumber: "(088) 387-1012", email: "social@camiguin.gov.ph", sortOrder: 3 },
  ];

  for (const dir of directories) {
    const existing = await prisma.directory.findFirst({
      where: { type: dir.type, nameEn: dir.nameEn },
    });
    if (!existing) {
      await prisma.directory.create({ data: dir });
    }
  }

  const downloads = [
    { titleEn: "Business Permit Application Form", titleFil: "Form ng Application para sa Business Permit", fileUrl: "/downloads/business-permit-form.pdf", fileName: "business-permit-form.pdf", category: "business", sortOrder: 1 },
    { titleEn: "Building Permit Application", titleFil: "Application para sa Building Permit", fileUrl: "/downloads/building-permit-form.pdf", fileName: "building-permit-form.pdf", category: "permit", sortOrder: 2 },
    { titleEn: "Citizens' Charter Handbook", titleFil: "Citizens' Charter Handbook", fileUrl: "/downloads/citizens-charter.pdf", fileName: "citizens-charter.pdf", category: "general", sortOrder: 3 },
  ];

  for (const download of downloads) {
    await prisma.download.create({ data: download });
  }

  const faqs = [
    { questionEn: "What are the office hours?", questionFil: "Ano ang mga oras ng opisina?", answerEn: "Office hours are Monday to Friday, 8:00 AM to 5:00 PM.", answerFil: "Ang mga oras ng opisina ay Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM.", category: "general", sortOrder: 1 },
    { questionEn: "How do I apply for a business permit?", questionFil: "Paano mag-apply para sa business permit?", answerEn: "Visit the Business Permits Office with required documents or use the Quick Start menu.", answerFil: "Bisitahin ang Business Permits Office na may mga kinakailangang dokumento o gamitin ang Quick Start menu.", category: "business", sortOrder: 2 },
    { questionEn: "Where can I get a cedula?", questionFil: "Saan ako makakakuha ng cedula?", answerEn: "Cedulas are issued at the Treasurer's Office at the Capitol Building.", answerFil: "Ang mga cedula ay inilalabas sa Treasurer's Office sa Capitol Building.", category: "tax", sortOrder: 3 },
  ];

  for (const faq of faqs) {
    await prisma.faq.create({ data: faq });
  }

  const announcements = [
    { titleEn: "Lanzones Festival 2024", titleFil: "Lanzones Festival 2024", contentEn: "Join us for the annual Lanzones Festival celebrating Camiguin's golden fruit.", contentFil: "Samahan kami sa taunang Lanzones Festival na nagdiriwang ng gintong prutas ng Camiguin.", publishedAt: new Date() },
    { titleEn: "New Online Services Portal", titleFil: "Bagong Online Services Portal", contentEn: "The provincial government launches new online services for faster transactions.", contentFil: "Inilunsad ng pamahalaang panlalawigan ang mga bagong online services para sa mas mabilis na transaksyon.", publishedAt: new Date() },
  ];

  for (const announcement of announcements) {
    await prisma.announcement.create({ data: announcement });
  }

  const tourismItems = [
    { titleEn: "White Island", titleFil: "White Island", descriptionEn: "A stunning sandbar with crystal-clear waters, perfect for snorkeling.", descriptionFil: "Isang kamangha-manghang sandbar na may kristal na malinaw na tubig, perpekto para sa snorkeling.", location: "Off the coast of Mambajao", category: "beach", sortOrder: 1 },
    { titleEn: "Katibawasan Falls", titleFil: "Katibawasan Falls", descriptionEn: "A majestic 250-foot waterfall surrounded by lush tropical forest.", descriptionFil: "Isang marangal na 250-foot na talon na napapaligiran ng masaganang tropikal na kagubatan.", location: "Mambajao", category: "nature", sortOrder: 2 },
    { titleEn: "Sunken Cemetery", titleFil: "Sunken Cemetery", descriptionEn: "A historical landmark from the 1871 volcanic eruption.", descriptionFil: "Isang makasaysayang palatandaan mula sa pagputok ng bulkan noong 1871.", location: "Bonbon, Catarman", category: "heritage", sortOrder: 3 },
  ];

  for (const item of tourismItems) {
    await prisma.tourism.create({ data: item });
  }

  const emergencyContacts = [
    { nameEn: "PNP Camiguin", nameFil: "PNP Camiguin", phoneNumber: "911", descriptionEn: "Philippine National Police", descriptionFil: "Philippine National Police", category: "police", sortOrder: 1 },
    { nameEn: "BFP Camiguin", nameFil: "BFP Camiguin", phoneNumber: "(088) 387-2001", descriptionEn: "Bureau of Fire Protection", descriptionFil: "Bureau of Fire Protection", category: "fire", sortOrder: 2 },
    { nameEn: "Provincial Hospital", nameFil: "Provincial Hospital", phoneNumber: "(088) 387-3001", descriptionEn: "Camiguin Provincial Hospital", descriptionFil: "Camiguin Provincial Hospital", category: "health", sortOrder: 3 },
    { nameEn: "Coast Guard", nameFil: "Coast Guard", phoneNumber: "(088) 387-4001", descriptionEn: "Philippine Coast Guard Station", descriptionFil: "Philippine Coast Guard Station", category: "rescue", sortOrder: 4 },
  ];

  for (const contact of emergencyContacts) {
    await prisma.emergencyContact.create({ data: contact });
  }

  const events = [
    { titleEn: "Provincial Development Council Meeting", titleFil: "Pagpupulong ng Provincial Development Council", descriptionEn: "Monthly meeting of the Provincial Development Council.", descriptionFil: "Buwanang pagpupulong ng Provincial Development Council.", location: "Capitol Session Hall", startDate: new Date("2024-06-15T09:00:00"), endDate: new Date("2024-06-15T12:00:00") },
    { titleEn: "Lanzones Festival", titleFil: "Lanzones Festival", descriptionEn: "Annual celebration of Camiguin's lanzones harvest.", descriptionFil: "Taunang pagdiriwang ng ani ng lanzones ng Camiguin.", location: "Mambajao Town Plaza", startDate: new Date("2024-10-20T08:00:00"), endDate: new Date("2024-10-22T22:00:00") },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }

  await prisma.page.upsert({
    where: { slug: "citizens-charter" },
    update: {},
    create: {
      slug: "citizens-charter",
      titleEn: "Citizens' Charter",
      titleFil: "Citizens' Charter",
      contentEn: "The Citizens' Charter is an official document that reflects the services of a government agency including requirements, fees, and processing times.",
      contentFil: "Ang Citizens' Charter ay isang opisyal na dokumento na sumasalamin sa mga serbisyo ng isang ahensya ng pamahalaan kasama ang mga kinakailangan, bayad, at oras ng pagproseso.",
    },
  });

  console.log("Database seeded successfully!");
  const { applyBisayaContent } = await import("./apply-bisaya-content");
  await applyBisayaContent(prisma);
  console.log("Cebuano content applied.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
