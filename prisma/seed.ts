import { PrismaClient, Role, InfrastructureTier, CropStage, OrderStatus, ShipmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Project Backbone database with Telangana Pilot demo data...");

  // 1. Clear existing tables in clean order
  await prisma.impactMetricTarget.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.expenseRecord.deleteMany();
  await prisma.settlementRecord.deleteMany();
  await prisma.farmerPayable.deleteMany();
  await prisma.buyerReceivable.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.qualityInspection.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderLine.deleteMany();
  await prisma.order.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.buybackResponse.deleteMany();
  await prisma.buybackOffer.deleteMany();
  await prisma.harvestLot.deleteMany();
  await prisma.harvestRecord.deleteMany();
  await prisma.sensorAlert.deleteMany();
  await prisma.sensorReading.deleteMany();
  await prisma.sensorDevice.deleteMany();
  await prisma.agronomyAdvisory.deleteMany();
  await prisma.cropInputActivityLog.deleteMany();
  await prisma.growthObservation.deleteMany();
  await prisma.cropCycle.deleteMany();
  await prisma.cropCatalogue.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.infrastructureInstallation.deleteMany();
  await prisma.farmUnit.deleteMany();
  await prisma.farmerProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Core Demo Users
  const userAdmin = await prisma.user.create({
    data: {
      id: "usr-admin-01",
      email: "admin.rajeev@projectbackbone.demo",
      name: "Rajeev Chary",
      phone: "+91 94401 23456",
      role: Role.ADMIN,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  const userOperator = await prisma.user.create({
    data: {
      id: "usr-operator-01",
      email: "operator.swapna@projectbackbone.demo",
      name: "Swapna Reddy",
      phone: "+91 98480 34567",
      role: Role.FRANCHISE_OPERATOR,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      id: "usr-agronomist-01",
      email: "agronomist.ramesh@projectbackbone.demo",
      name: "Dr. Ramesh V. Rao",
      phone: "+91 99890 45678",
      role: Role.AGRONOMIST,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  const userBuyer = await prisma.user.create({
    data: {
      id: "usr-buyer-01",
      email: "buyer.kavitha@projectbackbone.demo",
      name: "Kavitha Sunder",
      phone: "+91 98200 56789",
      role: Role.BUYER,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  const userLogistics = await prisma.user.create({
    data: {
      id: "usr-logistics-01",
      email: "logistics.naresh@projectbackbone.demo",
      name: "Naresh Naik",
      phone: "+91 97000 67890",
      role: Role.LOGISTICS_OPERATOR,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  // Buyer Profile
  await prisma.buyerProfile.create({
    data: {
      id: "bp-01",
      userId: userBuyer.id,
      buyerCode: "BUYER-HYD-001",
      companyName: "Hyderabad Fresh Marts Ltd.",
      businessType: "SUPERMARKET_CHAIN",
      gstNumber: "36AAACH7412K1Z9",
      deliveryAddress: "Central Distribution Center, Kompally, Hyderabad, Telangana 500014",
      contactPerson: "Kavitha Sunder (Head of Fresh Procurement)",
      creditLimit: 250000.0,
    },
  });

  // Second Buyer for market diversity
  const userBuyer2 = await prisma.user.create({
    data: {
      id: "usr-buyer-02",
      email: "buyer.deccan@projectbackbone.demo",
      name: "Venkat Rao",
      phone: "+91 98491 88220",
      role: Role.BUYER,
      isDemo: true,
      status: "ACTIVE",
    },
  });

  await prisma.buyerProfile.create({
    data: {
      id: "bp-02",
      userId: userBuyer2.id,
      buyerCode: "BUYER-DEC-002",
      companyName: "Deccan Organic Retailers Co.",
      businessType: "ORGANIC_SPECIALTY",
      gstNumber: "36AABCU9812M1Z4",
      deliveryAddress: "Gachibowli Hub, Hyderabad, Telangana 500032",
      contactPerson: "Venkat Rao (Director Sourcing)",
      creditLimit: 150000.0,
    },
  });

  // 3. Fictional 10 Farmers in Warangal & Mulugu (0.25 acres each)
  const farmersData = [
    {
      id: "usr-farmer-01",
      name: "Mallesham Goud",
      email: "farmer.mallesham@projectbackbone.demo",
      phone: "+91 90001 11001",
      farmerCode: "FARMER-WGL-001",
      village: "Dharmasagar",
      mandal: "Dharmasagar",
      district: "Warangal",
      upiId: "mallesham@ybl",
      tier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      farmName: "Sri Laxmi Hydroponic A-Frame Unit 1",
    },
    {
      id: "usr-farmer-02",
      name: "Anasuya Devi",
      email: "farmer.anasuya@projectbackbone.demo",
      phone: "+91 90001 11002",
      farmerCode: "FARMER-WGL-002",
      village: "Inavolu",
      mandal: "Inavolu",
      district: "Warangal",
      upiId: "anasuya.d@okaxis",
      tier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      farmName: "Kakatiya Greens Hydroponic Unit 2",
    },
    {
      id: "usr-farmer-03",
      name: "Kommula Komuraiah",
      email: "farmer.komuraiah@projectbackbone.demo",
      phone: "+91 90001 11003",
      farmerCode: "FARMER-WGL-003",
      village: "Geesugonda",
      mandal: "Geesugonda",
      district: "Warangal",
      upiId: "komuraiah.k@sbi",
      tier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      farmName: "Geesugonda Poly-Canopy Unit 3",
    },
    {
      id: "usr-farmer-04",
      name: "Boda Thulasi",
      email: "farmer.thulasi@projectbackbone.demo",
      phone: "+91 90001 11004",
      farmerCode: "FARMER-WGL-004",
      village: "Parkal",
      mandal: "Parkal",
      district: "Warangal",
      upiId: "boda.thulasi@icici",
      tier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      farmName: "Parkal Protected Canopy Unit 4",
    },
    {
      id: "usr-farmer-05",
      name: "Dharavath Bhaskar",
      email: "farmer.bhaskar@projectbackbone.demo",
      phone: "+91 90001 11005",
      farmerCode: "FARMER-WGL-005",
      village: "Atmakur",
      mandal: "Atmakur",
      district: "Warangal",
      upiId: "bhaskar.d@kotak",
      tier: InfrastructureTier.FARMGATE_PROCESSING_SILO,
      farmName: "Atmakur Farmgate Aggregation & Silo 5",
    },
    {
      id: "usr-farmer-06",
      name: "Madavi Lingaiah",
      email: "farmer.lingaiah@projectbackbone.demo",
      phone: "+91 90001 11006",
      farmerCode: "FARMER-MLG-006",
      village: "Govindaraopet",
      mandal: "Govindaraopet",
      district: "Mulugu",
      upiId: "lingaiah.m@axl",
      tier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      farmName: "Ramappa Green Hydroponics Unit 6",
    },
    {
      id: "usr-farmer-07",
      name: "Gugulothu Saritha",
      email: "farmer.saritha@projectbackbone.demo",
      phone: "+91 90001 11007",
      farmerCode: "FARMER-MLG-007",
      village: "Venkatapur",
      mandal: "Venkatapur",
      district: "Mulugu",
      upiId: "saritha.g@ibl",
      tier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      farmName: "Mulugu Eco-A-Frame Unit 7",
    },
    {
      id: "usr-farmer-08",
      name: "Jadhav Ramesh",
      email: "farmer.jadhav@projectbackbone.demo",
      phone: "+91 90001 11008",
      farmerCode: "FARMER-MLG-008",
      village: "Tadvai",
      mandal: "Tadvai",
      district: "Mulugu",
      upiId: "ramesh.jadhav@upi",
      tier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      farmName: "Eturnagaram Border Poly-Canopy 8",
    },
    {
      id: "usr-farmer-09",
      name: "Payam Sammakka",
      email: "farmer.sammakka@projectbackbone.demo",
      phone: "+91 90001 11009",
      farmerCode: "FARMER-MLG-009",
      village: "Medaram",
      mandal: "SS Tadwai",
      district: "Mulugu",
      upiId: "sammakka.p@sbi",
      tier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      farmName: "Medaram Cluster Canopy Unit 9",
    },
    {
      id: "usr-farmer-10",
      name: "Vemula Narsing Rao",
      email: "farmer.narsing@projectbackbone.demo",
      phone: "+91 90001 11010",
      farmerCode: "FARMER-WGL-010",
      village: "Station Ghanpur",
      mandal: "Ghanpur",
      district: "Warangal",
      upiId: "narsing.v@hdfcbank",
      tier: InfrastructureTier.FARMGATE_PROCESSING_SILO,
      farmName: "Ghanpur Hub Solar Drying & Silo 10",
    },
  ];

  const createdFarmUnits = [];

  for (const f of farmersData) {
    const user = await prisma.user.create({
      data: {
        id: f.id,
        email: f.email,
        name: f.name,
        phone: f.phone,
        role: Role.FARMER,
        isDemo: true,
        status: "ACTIVE",
      },
    });

    const profile = await prisma.farmerProfile.create({
      data: {
        userId: user.id,
        farmerCode: f.farmerCode,
        village: f.village,
        mandal: f.mandal,
        district: f.district,
        state: "Telangana",
        totalAcres: 0.25,
        bankAccountName: f.name,
        bankAccountNumber: `SBIN00${Math.floor(10000000 + Math.random() * 90000000)}`,
        ifscCode: "SBIN0020145",
        upiId: f.upiId,
        kycStatus: "VERIFIED_DEMO",
      },
    });

    const farmUnit = await prisma.farmUnit.create({
      data: {
        farmCode: `FARM-${f.farmerCode.replace("FARMER-", "")}`,
        name: f.farmName,
        farmerProfileId: profile.id,
        operatorUserId: userOperator.id,
        tier: f.tier,
        areaAcres: 0.25,
        locationAddress: `${f.village} Village, ${f.mandal} Mandal, ${f.district} District, Telangana`,
        latitude: f.district === "Warangal" ? 17.9689 : 18.1912,
        longitude: f.district === "Warangal" ? 79.5941 : 80.0134,
        status: "OPERATIONAL",
      },
    });

    createdFarmUnits.push(farmUnit);

    // Create Infrastructure Installation
    await prisma.infrastructureInstallation.create({
      data: {
        farmUnitId: farmUnit.id,
        tier: f.tier,
        assetCode: `ASSET-${farmUnit.farmCode}`,
        specifications:
          f.tier === InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME
            ? "12-Row Food Grade PVC A-Frame, 2.5 kW Off-Grid Solar Fertigation Pump, Automated Dosatron"
            : f.tier === InfrastructureTier.SEMI_CLOSED_POLY_CANOPY
            ? "200 Micron UV-Stabilized Polyethylene, 40-Mesh Anti-Insect Netting, Evaporative Foggers"
            : "Hermetic Moisture-Controlled Grain Silo 5-MT, High-Efficiency Solar Convective Dehydrator",
        solarCapacityKw: f.tier === InfrastructureTier.FARMGATE_PROCESSING_SILO ? 5.0 : 2.5,
        waterTankCapacityLiters: 5000,
        status: "HEALTHY",
      },
    });

    // Create Maintenance Log
    await prisma.maintenanceLog.create({
      data: {
        farmUnitId: farmUnit.id,
        category: "SOLAR_FERTIGATION",
        description: "Scheduled filter backwash, nutrient injector calibration, and solar battery terminal check.",
        cost: 650.0,
        performedBy: "Franchise Field Tech (Warangal Team)",
        status: "COMPLETED",
        source: "DEMO",
      },
    });

    // Create Sensor Device
    const sensorDevice = await prisma.sensorDevice.create({
      data: {
        deviceCode: `ESP32-NODE-${farmUnit.farmCode}`,
        farmUnitId: farmUnit.id,
        protocol: "ESP32_LORAWAN",
        model: "AgriSense Pro v2.4 (LoRa 865MHz IN)",
        batteryLevel: 94.5,
        signalStrengthDbm: -68,
        status: "ONLINE",
        source: "SIMULATED",
      },
    });

    // Create Timestamped Sensor Readings
    const now = new Date("2026-10-26T18:00:00Z");
    for (let h = 0; h < 6; h++) {
      const readTime = new Date(now.getTime() - h * 2 * 3600 * 1000);
      await prisma.sensorReading.create({
        data: {
          sensorDeviceId: sensorDevice.id,
          timestamp: readTime,
          soilMoisturePercent: 68.2 - h * 0.4,
          ambientTemperatureC: 28.5 + (h % 2 === 0 ? 1.2 : -0.8),
          relativeHumidityPercent: 64.0 - h * 0.5,
          ecMilliSiemens: 1.82 + (h % 3) * 0.05,
          phLevel: 6.35 + (h % 2) * 0.1,
          solarRadiationWm2: h < 3 ? 550.0 - h * 120 : 0.0,
          flowRateLpm: 12.5,
          source: "SIMULATED",
        },
      });
    }

    // Occasional Alert on farm 2 & 8 for realistic dashboard state
    if (f.farmerCode === "FARMER-WGL-002") {
      await prisma.sensorAlert.create({
        data: {
          sensorDeviceId: sensorDevice.id,
          parameter: "EC_CONDUCTIVITY",
          currentValue: 2.35,
          thresholdValue: 2.2,
          severity: "WARNING",
          message: "Nutrient solution EC elevated above 2.2 mS/cm. Recommend 10L clean water flush.",
          isResolved: false,
          triggeredAt: new Date(now.getTime() - 4 * 3600 * 1000),
          source: "SIMULATED",
        },
      });
    }
  }

  // 4. Crop Catalogues
  const crops = [
    {
      cropCode: "GONGURA",
      name: "Gongura (Telangana Sorrel Leaves)",
      teluguName: "గోంగూర",
      variety: "Telangana Broadleaf Desi Hybrid",
      preferredTier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      cycleDurationDays: 32,
      waterRequirementPerDayLiters: 90.0,
      targetYieldKgPerAcre: 3200.0,
      benchmarkMarketPricePerKg: 38.0,
      description: "Iconic Telangana culinary green. High iron content, fast cycle in vertical NFT hydroponics.",
    },
    {
      cropCode: "CORIANDER",
      name: "Coriander (Kothimeera)",
      teluguName: "కొత్తిమీర",
      variety: "Aroma Super-Green Multi-Cut",
      preferredTier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      cycleDurationDays: 28,
      waterRequirementPerDayLiters: 85.0,
      targetYieldKgPerAcre: 2800.0,
      benchmarkMarketPricePerKg: 45.0,
      description: "High aroma, crisp hydroponic coriander with 3 multi-cut regrowth cycles.",
    },
    {
      cropCode: "PUDINA",
      name: "Spearmint (Pudina)",
      teluguName: "పుదీనా",
      variety: "Telangana Local Peppermint",
      preferredTier: InfrastructureTier.VERTICAL_HYDROPONIC_A_FRAME,
      cycleDurationDays: 35,
      waterRequirementPerDayLiters: 95.0,
      targetYieldKgPerAcre: 3500.0,
      benchmarkMarketPricePerKg: 40.0,
      description: "Dense vegetative growth, essential herb for Telangana food industry and biryani houses.",
    },
    {
      cropCode: "RED_CHILLI",
      name: "Red Chilli (Warangal Chapti / Teja)",
      teluguName: "ఎర్ర మిరప",
      variety: "Warangal Teja Guntur Hybrid",
      preferredTier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      cycleDurationDays: 110,
      waterRequirementPerDayLiters: 140.0,
      targetYieldKgPerAcre: 4800.0,
      benchmarkMarketPricePerKg: 195.0,
      description: "World-renowned Warangal red chilli with high capsaicin content and deep red coloration.",
    },
    {
      cropCode: "TOMATO",
      name: "Vine-Ripened Tomato",
      teluguName: "టమాట",
      variety: "Arka Rakshak F1 Hybrid",
      preferredTier: InfrastructureTier.SEMI_CLOSED_POLY_CANOPY,
      cycleDurationDays: 75,
      waterRequirementPerDayLiters: 160.0,
      targetYieldKgPerAcre: 12000.0,
      benchmarkMarketPricePerKg: 28.0,
      description: "Triple-disease resistant indeterminate hybrid with uniform firmness for transport.",
    },
    {
      cropCode: "ONION",
      name: "High-Shelf Cured Onion",
      teluguName: "ఉల్లిపాయ",
      variety: "Bhima Super Red",
      preferredTier: InfrastructureTier.FARMGATE_PROCESSING_SILO,
      cycleDurationDays: 105,
      waterRequirementPerDayLiters: 120.0,
      targetYieldKgPerAcre: 9000.0,
      benchmarkMarketPricePerKg: 32.0,
      description: "Cured in farmgate convective solar sheds for zero sprouting and minimal transit loss.",
    },
  ];

  const createdCrops = [];
  for (const c of crops) {
    const crop = await prisma.cropCatalogue.create({ data: c });
    createdCrops.push(crop);
  }

  // 5. Active Crop Cycles across farms
  const gonguraCrop = createdCrops.find((c) => c.cropCode === "GONGURA")!;
  const corianderCrop = createdCrops.find((c) => c.cropCode === "CORIANDER")!;
  const chilliCrop = createdCrops.find((c) => c.cropCode === "RED_CHILLI")!;

  // Farm 1 Cycle (Gongura - Harvest Ready)
  const cycle1 = await prisma.cropCycle.create({
    data: {
      cycleCode: "CYCLE-2026-WGL-GON-01",
      farmUnitId: createdFarmUnits[0].id,
      cropCatalogueId: gonguraCrop.id,
      stage: CropStage.HARVESTING,
      healthStatus: "EXCELLENT",
      plantedDate: new Date("2026-09-24T00:00:00Z"),
      expectedHarvestDate: new Date("2026-10-26T00:00:00Z"),
      actualHarvestDate: new Date("2026-10-26T08:00:00Z"),
      targetYieldKg: 800.0,
      actualYieldKg: 820.0,
      status: "ACTIVE",
    },
  });

  // Farm 2 Cycle (Coriander - Vegetative)
  await prisma.cropCycle.create({
    data: {
      cycleCode: "CYCLE-2026-WGL-COR-02",
      farmUnitId: createdFarmUnits[1].id,
      cropCatalogueId: corianderCrop.id,
      stage: CropStage.VEGETATIVE,
      healthStatus: "NORMAL",
      plantedDate: new Date("2026-10-08T00:00:00Z"),
      expectedHarvestDate: new Date("2026-11-05T00:00:00Z"),
      targetYieldKg: 700.0,
      actualYieldKg: 0.0,
      status: "ACTIVE",
    },
  });

  // Farm 3 Cycle (Red Chilli - Flowering)
  await prisma.cropCycle.create({
    data: {
      cycleCode: "CYCLE-2026-WGL-CHL-03",
      farmUnitId: createdFarmUnits[2].id,
      cropCatalogueId: chilliCrop.id,
      stage: CropStage.FLOWERING_FRUITING,
      healthStatus: "EXCELLENT",
      plantedDate: new Date("2026-08-15T00:00:00Z"),
      expectedHarvestDate: new Date("2026-11-20T00:00:00Z"),
      targetYieldKg: 1200.0,
      actualYieldKg: 0.0,
      status: "ACTIVE",
    },
  });

  // Growth Observations & Advisories for Cycle 1
  await prisma.growthObservation.create({
    data: {
      cropCycleId: cycle1.id,
      observedDate: new Date("2026-10-24T10:00:00Z"),
      growthStage: CropStage.MATURE,
      plantHeightCm: 32.5,
      leafCount: 48,
      canopyCoveragePercent: 96.0,
      pestIncidence: "NONE",
      notes: "Leaves exhibit robust red-purple venation and prime tartness. Zero sign of fungal mildew.",
      observedBy: "Dr. Ramesh V. Rao",
      source: "DEMO",
    },
  });

  await prisma.agronomyAdvisory.create({
    data: {
      cropCycleId: cycle1.id,
      advisoryCode: "ADV-2026-GON-001",
      title: "Pre-Harvest Dewatering & Cold-Chain Staging Protocol",
      category: "HARVEST_TIMING",
      severity: "LOW",
      content: "Cut irrigation 4 hours prior to dawn harvest to maximize leaf turgidity and shelf freshness. Stage directly in crates lined with breathable mulching sheets.",
      recommendedActions: "Cease fertigation cycle at 04:00 AM. Harvest commencing at 06:30 AM before radiant heat.",
      issuedBy: "AI Agronomy Engine v2.4 (Simulated)",
      source: "SIMULATED",
      isActioned: true,
      actionedAt: new Date("2026-10-25T16:00:00Z"),
    },
  });

  // 6. Harvest Records and Traceable Lots
  const harvest1 = await prisma.harvestRecord.create({
    data: {
      harvestCode: "HRV-2026-WGL-001",
      cropCycleId: cycle1.id,
      farmUnitId: createdFarmUnits[0].id,
      harvestDate: new Date("2026-10-26T07:30:00Z"),
      grossQuantityKg: 820.0,
      farmgateQualityNotes: "Crisp texture, certified pesticide-free, graded A on sorting conveyor.",
      loggedBy: "Swapna Reddy (Franchise Operator)",
      source: "DEMO",
    },
  });

  // Lot 1: Available & Reserved
  const lot1 = await prisma.harvestLot.create({
    data: {
      lotCode: "LOT-WGL-GON-2026-001",
      harvestRecordId: harvest1.id,
      grade: "GRADE_A",
      initialQuantityKg: 500.0,
      availableQuantityKg: 200.0,
      reservedQuantityKg: 300.0,
      soldQuantityKg: 0.0,
      unitPricePerKg: 40.0,
      curationStatus: "PARTIALLY_RESERVED",
      storageFacility: "Warangal North Cold Bay A",
    },
  });

  // Lot 2: Grade B batch
  await prisma.harvestLot.create({
    data: {
      lotCode: "LOT-WGL-GON-2026-002",
      harvestRecordId: harvest1.id,
      grade: "GRADE_B",
      initialQuantityKg: 320.0,
      availableQuantityKg: 320.0,
      reservedQuantityKg: 0.0,
      soldQuantityKg: 0.0,
      unitPricePerKg: 32.0,
      curationStatus: "AVAILABLE",
      storageFacility: "Warangal North Ambient Bay C",
    },
  });

  // 7. Buyback Offers & Agreements
  const buybackOffer1 = await prisma.buybackOffer.create({
    data: {
      offerCode: "BBO-2026-Q4-GONGURA",
      cropCatalogueId: gonguraCrop.id,
      title: "Telangana Food Processing Guaranteed Gongura Buyback (Q4 2026)",
      guaranteedPricePerKg: 38.0,
      bonusGradeAPerKg: 4.0,
      maxQuantityKg: 10000.0,
      validFrom: new Date("2026-09-01T00:00:00Z"),
      validUntil: new Date("2026-12-31T00:00:00Z"),
      terms: "100% off-take of Grade A and B harvests with guaranteed payment clearance within 24 hours of farmgate collection.",
      status: "ACTIVE",
    },
  });

  await prisma.buybackResponse.create({
    data: {
      buybackOfferId: buybackOffer1.id,
      farmerProfileId: createdFarmUnits[0].farmerProfileId,
      committedQuantityKg: 1600.0,
      status: "ACCEPTED",
    },
  });

  // 8. Order from Hyderabad Fresh Marts
  const buyerProfile = await prisma.buyerProfile.findUnique({
    where: { userId: userBuyer.id },
  })!;

  const order1 = await prisma.order.create({
    data: {
      orderNumber: "ORD-2026-10-8801",
      buyerProfileId: buyerProfile!.id,
      totalAmount: 12000.0, // 300 kg * 40.0
      status: OrderStatus.IN_TRANSIT,
      deliveryAddress: "Kompally Distribution Hub, Hyderabad",
      expectedDeliveryDate: new Date("2026-10-27T10:00:00Z"),
      notes: "Prime morning delivery required for retail shelves.",
      source: "DEMO",
    },
  });

  await prisma.orderLine.create({
    data: {
      orderId: order1.id,
      harvestLotId: lot1.id,
      quantityKg: 300.0,
      unitPricePerKg: 40.0,
      lineTotal: 12000.0,
      acceptedQuantityKg: 300.0,
    },
  });

  // Inventory reservation movement
  await prisma.inventoryMovement.create({
    data: {
      harvestLotId: lot1.id,
      movementType: "RESERVATION_HOLD",
      quantityKg: 300.0,
      balanceAfterKg: 200.0,
      reason: "Reserved for Order ORD-2026-10-8801",
      referenceCode: order1.orderNumber,
      recordedBy: "Automated Marketplace Engine",
    },
  });

  // 9. Shipment & Cold-Chain Tracking
  const shipment1 = await prisma.shipment.create({
    data: {
      shipmentCode: "SHP-2026-WGL-044",
      orderId: order1.id,
      driverUserId: userLogistics.id,
      vehicleNumber: "TS-03-EB-4192",
      vehicleType: "Refrigerated Mini-Van 1.5T",
      pickupLocation: "Warangal North Cold Bay A",
      destination: "Hyderabad Central Distribution Hub, Kompally",
      scheduledPickupTime: new Date("2026-10-26T14:00:00Z"),
      actualPickupTime: new Date("2026-10-26T14:15:00Z"),
      temperatureLogC: 4.2,
      status: ShipmentStatus.IN_TRANSIT,
      trackingNotes: "GPS active. Vehicle in transit on NH-163 near Jangaon. Cargo temperature 4.2°C steady.",
    },
  });

  // Quality Inspection
  await prisma.qualityInspection.create({
    data: {
      inspectionCode: "QC-2026-WGL-091",
      shipmentId: shipment1.id,
      harvestLotId: lot1.id,
      inspectedBy: "Naresh Naik (Logistics Lead)",
      verifiedGrade: "GRADE_A",
      sampledQuantityKg: 10.0,
      totalDeliveredQuantityKg: 300.0,
      acceptedQuantityKg: 300.0,
      rejectedQuantityKg: 0.0,
      freshnessScore: 9.6,
      status: "ACCEPTED",
      source: "DEMO",
    },
  });

  // 10. Financial Records (Invoice & Farmer 24h Payout Settlement)
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0881",
      orderId: order1.id,
      grossAmount: 12000.0,
      taxAmount: 0.0,
      netAmount: 12000.0,
      paymentStatus: "PAID",
      dueDate: new Date("2026-11-05T00:00:00Z"),
    },
  });

  await prisma.buyerReceivable.create({
    data: {
      invoiceId: invoice1.id,
      amount: 12000.0,
      paymentMethod: "NEFT_ESCROW",
      transactionReference: "NEFT-AXIS-99210293",
      paidAt: new Date("2026-10-26T15:00:00Z"),
      status: "CONFIRMED",
      source: "SIMULATED",
    },
  });

  // Farmer Payable & Settlement
  const farmer1Profile = (await prisma.farmerProfile.findFirst({
    where: { farmerCode: "FARMER-WGL-001" },
  }))!;

  const payable1 = await prisma.farmerPayable.create({
    data: {
      payableCode: "PAY-WGL-2026-001",
      farmerProfileId: farmer1Profile.id,
      grossAmount: 12000.0,
      deductionsAmount: 350.0, // Packaging & eco-crate handling
      netPayable: 11650.0,
      reason: "Farmgate settlement for Gongura Lot #LOT-WGL-GON-2026-001 (300kg @ ₹40.0/kg)",
      status: "SETTLED",
      dueDate: new Date("2026-10-27T08:00:00Z"),
    },
  });

  await prisma.settlementRecord.create({
    data: {
      settlementCode: "SETTLE-WGL-2026-001",
      farmerPayableId: payable1.id,
      farmerProfileId: farmer1Profile.id,
      payoutMethod: "INSTANT_UPI_24H",
      disbursedAmount: 11650.0,
      transactionReference: "UPI-TELANGANA-90184729104",
      disbursedAt: new Date("2026-10-26T17:30:00Z"),
      hoursToSettle: 3.25, // Less than 24 hours!
      settlementStatus: "SETTLED",
      source: "SIMULATED",
    },
  });

  // Second pending payable for demonstration of pending settlement workflow
  const farmer2Profile = (await prisma.farmerProfile.findFirst({
    where: { farmerCode: "FARMER-WGL-002" },
  }))!;

  await prisma.farmerPayable.create({
    data: {
      payableCode: "PAY-WGL-2026-002",
      farmerProfileId: farmer2Profile.id,
      grossAmount: 6400.0,
      deductionsAmount: 0.0,
      netPayable: 6400.0,
      reason: "Advance nursery material compensation for Coriander Cycle #CYCLE-2026-WGL-COR-02",
      status: "PENDING",
      dueDate: new Date("2026-10-27T18:00:00Z"),
    },
  });

  // 11. Expenses
  await prisma.expenseRecord.create({
    data: {
      expenseCode: "EXP-2026-01",
      category: "COLD_CHAIN_DIESEL",
      amount: 1450.0,
      description: "Reefer vehicle fuel and temperature logging calibration for Warangal-Hyderabad run",
      paidTo: "Indian Oil Warangal Bypass",
      source: "DEMO",
    },
  });

  await prisma.expenseRecord.create({
    data: {
      expenseCode: "EXP-2026-02",
      category: "IOT_MAINTENANCE",
      amount: 2200.0,
      description: "Replacement LoRa antenna and solar battery backup for Mulugu cluster hub",
      paidTo: "AgriTech Hardware Supplies Hyd",
      source: "DEMO",
    },
  });

  // 12. Notifications for demo users
  await prisma.notification.create({
    data: {
      userId: userAdmin.id,
      title: "24-Hour Settlement Milestone",
      message: "Farmer Mallesham Goud received ₹11,650 instant settlement within 3.25 hours of harvest acceptance.",
      type: "SETTLEMENT",
      link: "/finance",
    },
  });

  await prisma.notification.create({
    data: {
      userId: "usr-farmer-01",
      title: "Instant Bank Payout Credited",
      message: "₹11,650 transferred to UPI mallesham@ybl for 300kg Grade-A Gongura.",
      type: "SETTLEMENT",
      link: "/finance",
    },
  });

  await prisma.notification.create({
    data: {
      userId: userBuyer.id,
      title: "Shipment Dispatched: TS-03-EB-4192",
      message: "Your order ORD-2026-10-8801 of 300kg Gongura is in cold-chain transit. Current temp: 4.2°C.",
      type: "SHIPMENT",
      link: "/orders",
    },
  });

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: userAdmin.id,
      action: "INIT_DEMO_DATASET",
      entityType: "SystemState",
      entityId: "PILOT-WARANGAL-MULUGU",
      previousState: null,
      newState: "INITIALIZED_10_UNITS",
      reason: "Initial deterministic database seed for Project Backbone Telangana pilot prototype.",
    },
  });

  // 14. Impact Metric Targets (CRITICAL: Targets, NOT validated outcomes)
  const impactTargets = [
    {
      metricKey: "INCOME_MULTIPLIER",
      title: "Smallholder Farmer Income Multiplier",
      baselineValue: 1.0,
      targetValue: 2.4,
      currentSimulatedValue: 2.15,
      unit: "x Baseline",
      isTargetOnly: true,
      targetDescription: "Targeting a 2.4x net return through high-density hydroponic A-frames and direct guaranteed farmgate buyback.",
    },
    {
      metricKey: "POST_HARVEST_LOSS_PCT",
      title: "Post-Harvest Waste Reduction",
      baselineValue: 28.0,
      targetValue: 5.0,
      currentSimulatedValue: 4.2,
      unit: "% Loss",
      isTargetOnly: true,
      targetDescription: "Targeting under 5% post-harvest spoilage via immediate cold-chain farmgate pickup vs conventional mandi waste.",
    },
    {
      metricKey: "WATER_CONSERVATION_PCT",
      title: "Agricultural Water Conservation",
      baselineValue: 0.0,
      targetValue: 90.0,
      currentSimulatedValue: 91.8,
      unit: "% Conserved",
      isTargetOnly: true,
      targetDescription: "Targeting 90% water reduction using closed-loop vertical nutrient recirculation vs flood irrigation.",
    },
    {
      metricKey: "CROP_SURVIVAL_PCT",
      title: "Crop Survival & Survival Yield",
      baselineValue: 72.0,
      targetValue: 95.0,
      currentSimulatedValue: 96.5,
      unit: "% Survival",
      isTargetOnly: true,
      targetDescription: "Targeting >= 95% seedling-to-harvest survival via semi-closed microclimate sensors and timely bio-fertigation.",
    },
    {
      metricKey: "SETTLEMENT_HOURS",
      title: "Farmgate Payment Settlement Speed",
      baselineValue: 45.0 * 24.0, // 45 days in hours
      targetValue: 24.0,
      currentSimulatedValue: 3.25,
      unit: "Hours",
      isTargetOnly: true,
      targetDescription: "Targeting 100% digital settlement within 24 hours of farmgate acceptance vs 30-45 day middleman lag.",
    },
    {
      metricKey: "PESTICIDE_RUNOFF_KG",
      title: "Zero Chemical Runoff",
      baselineValue: 14.5,
      targetValue: 0.0,
      currentSimulatedValue: 0.0,
      unit: "kg/acre Runoff",
      isTargetOnly: true,
      targetDescription: "Targeting zero pesticide runoff into Telangana ground water tables via closed organic/bio-input protocol.",
    },
  ];

  for (const it of impactTargets) {
    await prisma.impactMetricTarget.create({ data: it });
  }

  // 15. System Config
  await prisma.systemConfig.create({
    data: {
      key: "PILOT_REGION",
      value: "Warangal & Mulugu Districts, Telangana, India",
      description: "Designated pilot operational zone for Project Backbone",
    },
  });

  await prisma.systemConfig.create({
    data: {
      key: "PILOT_SCALE",
      value: "10 Smallholder Farmer Units (0.25 Acres Each)",
      description: "Scale parameter for Phase 1 proof-of-concept",
    },
  });

  console.log("Database seeded successfully with 10 farmer units, 6 roles, orders, lots, sensors, and impact metrics!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
