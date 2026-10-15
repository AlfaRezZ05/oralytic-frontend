import type { ScreeningRecord } from '../types';

export const INITIAL_MOCK_RECORDS: ScreeningRecord[] = [
  {
    id: 'ORL-2024-001',
    date: '2024-08-15T09:30:00.000Z',
    patientData: {
      nik: '3578012301200003',
      name: 'Kenzo Alvaro Pratama',
      dob: '2020-01-23',
      gender: 'Male',
      weight: '12.8',
      height: '94.0',
      headCircumference: '48.5',
      armCircumference: '13.2',
    },
    stuntingData: {
      ageGroup: '>24',
      exclusiveBreastfeeding: 'yes',
      sugarInFormula: 'yes',
      mpasiStartDate: '6',
      mpasiMenu: ['Bubur Beras', 'Sayur'],
      mpasiTexture: 'Lumat',
      snackFrequency: '3x',
      snackType: 'Biskuit manis',
      sweetDrinkFrequency: 'Setiap hari',
      sleepWithBottle: 'yes',
      gumCleaningStartDate: '12',
      useSpecialToothpaste: 'yes',
      mainMealsPerDay: '2x',
      dailyDietIncludes: ['Nasi', 'Telur'],
      isPickyEater: 'yes',
      pickyEaterFoods: 'Menolak sayur dan ikan',
      snackFrequencyOutside: 'Sering',
      favoriteSnack: 'Permen & Cokelat',
      weeklyConsumption: {
        soda: '1-2x/minggu',
        packagedSnacks: 'Hampir setiap hari',
        sweets: 'Setiap hari',
        fastFood: 'Jarang'
      },
      brushingFrequency: '1x sehari',
      brushingHabits: ['Sebelum tidur sering terlewat'],
      dentalPain: 'yes'
    },
    oralAnalyses: [
      {
        imageBase64: '',
        analysisResult: {
          hygieneAssessment: 'Poor',
          issues: [
            {
              diseaseName: 'Dental caries on pit and fissure surface penetrating into dentin',
              description: 'Kavitas karies mencapai lapisan dentin pada gigi geraham sulung bawah kanan.',
              boundingBox: { x: 35, y: 40, width: 25, height: 28 }
            },
            {
              diseaseName: 'Acute gingivitis',
              description: 'Gusi kemerahan dan edema ringan pada margin interdental depan.',
              boundingBox: { x: 42, y: 65, width: 20, height: 18 }
            }
          ]
        }
      }
    ],
    healthReport: {
      nutritionResult: 'Needs Referral',
      stuntingStatus: 'Pendek (Stunted)',
      heightForAgeZScore: -2.95,
      weightStatus: 'Gizi Kurang (Underweight)',
      weightForAgeZScore: -2.25,
      wastingStatus: 'Normal',
      wastingZScore: -1.15,
      lilaStatus: 'Gizi Kurang (< 14 cm)',
      growthStatus: 'Perawakan Pendek',
      bmi: 14.5,
      bmiStatus: 'Normal',
      nutritionReason: 'TB/U Z-Score -2.95 SD berada di bawah ambang batas -2 SD (Kategori Pendek). Disertai asupan protein rendah akibat nyeri saat mengunyah.',
      oralResult: 'Needs Referral',
      oralReason: 'Ditemukan karies dentin aktif dan radang gusi akut yang mengganggu fungsi mastikasi anak.',
      conclusion: 'Pasien mengalami stunting yang berkorelasi kuat dengan karies gigi kronis dan nyeri kunyah.',
      recommendations: [
        'Rujuk segera ke Dokter Gigi Spesialis Kedokteran Gigi Anak (Sp.KGA) untuk penambalan.',
        'Konsultasi Poli Gizi Puskesmas untuk pemberian Makanan Tambahan (PMT) tinggi protein hewani.',
        'Edukasi orang tua teknik sikat gigi 2x sehari dengan pasta gigi berfluoride.'
      ]
    }
  },
  {
    id: 'ORL-2024-002',
    date: '2024-11-20T10:15:00.000Z',
    patientData: {
      nik: '3578012301200003',
      name: 'Kenzo Alvaro Pratama',
      dob: '2020-01-23',
      gender: 'Male',
      weight: '13.6',
      height: '97.5',
      headCircumference: '49.0',
      armCircumference: '13.8',
    },
    stuntingData: {
      ageGroup: '>24',
      exclusiveBreastfeeding: 'yes',
      sugarInFormula: 'no',
      mpasiStartDate: '6',
      mpasiMenu: ['Bubur', 'Ayam', 'Wortel'],
      mpasiTexture: 'Padat',
      snackFrequency: '2x',
      snackType: 'Buah potong',
      sweetDrinkFrequency: 'Jarang',
      sleepWithBottle: 'no',
      gumCleaningStartDate: '12',
      useSpecialToothpaste: 'yes',
      mainMealsPerDay: '3x',
      dailyDietIncludes: ['Nasi', 'Telur', 'Ikan', 'Susu'],
      isPickyEater: 'no',
      pickyEaterFoods: '',
      snackFrequencyOutside: 'Jarang',
      favoriteSnack: 'Pisang & Biskuit gandum',
      weeklyConsumption: {
        soda: 'Tidak pernah',
        packagedSnacks: '1x/minggu',
        sweets: 'Jarang',
        fastFood: 'Tidak pernah'
      },
      brushingFrequency: '2x sehari',
      brushingHabits: ['Pagi dan malam sebelum tidur'],
      dentalPain: 'no'
    },
    oralAnalyses: [
      {
        imageBase64: '',
        analysisResult: {
          hygieneAssessment: 'Fair',
          issues: [
            {
              diseaseName: 'TriPlaque: Old Plaque (>48h)',
              description: 'Plak matang terlokalisir pada area servikal gigi posterior.',
              boundingBox: { x: 45, y: 55, width: 18, height: 16 }
            }
          ]
        }
      }
    ],
    healthReport: {
      nutritionResult: 'Needs Monitoring',
      stuntingStatus: 'Perbaikan Pertumbuhan (Borderline)',
      heightForAgeZScore: -2.35,
      weightStatus: 'Normal',
      weightForAgeZScore: -1.65,
      wastingStatus: 'Normal',
      wastingZScore: -0.85,
      lilaStatus: 'Normal',
      growthStatus: 'Perawakan Pendek',
      bmi: 14.3,
      bmiStatus: 'Normal',
      nutritionReason: 'TB/U Z-Score membaik dari -2.95 SD menjadi -2.35 SD setelah penanganan nyeri gigi dan intervensi gizi.',
      oralResult: 'At Risk of Caries',
      oralReason: 'Karies sebelumnya telah ditangani, ditemukan residu plak lama yang perlu peningkatan kebersihan mulut.',
      conclusion: 'Terdapat progres perbaikan pertumbuhan fisik setelah penanganan masalah gigi dan mulut.',
      recommendations: [
        'Lanjutkan pemantauan berat dan tinggi badan bulanan di Posyandu/Puskesmas.',
        'Pembersihan karang gigi / plak berkala.',
        'Pertahankan diet seimbang dan asupan kalsium serta vitamin D.'
      ]
    }
  },
  {
    id: 'ORL-2024-003',
    date: '2024-10-05T08:45:00.000Z',
    patientData: {
      nik: '3578016509210001',
      name: 'Alika Putri Kinanti',
      dob: '2021-09-15',
      gender: 'Female',
      weight: '11.0',
      height: '87.5',
      headCircumference: '47.0',
      armCircumference: '13.5',
    },
    stuntingData: {
      ageGroup: '>24',
      exclusiveBreastfeeding: 'yes',
      sugarInFormula: 'yes',
      mpasiStartDate: '6',
      mpasiMenu: ['Bubur', 'Tahu', 'Telur'],
      mpasiTexture: 'Keluarga',
      snackFrequency: '2-3x',
      snackType: 'Wafer manis',
      sweetDrinkFrequency: 'Teh manis 1-2x/hari',
      sleepWithBottle: 'yes',
      gumCleaningStartDate: '10',
      useSpecialToothpaste: 'yes',
      mainMealsPerDay: '3x',
      dailyDietIncludes: ['Nasi', 'Telur'],
      isPickyEater: 'yes',
      pickyEaterFoods: 'Sulit makan daging merah',
      snackFrequencyOutside: 'Kadang',
      favoriteSnack: 'Cokelat',
      weeklyConsumption: {
        soda: 'Tidak pernah',
        packagedSnacks: '3x/minggu',
        sweets: 'Sering',
        fastFood: 'Jarang'
      },
      brushingFrequency: '1x sehari',
      brushingHabits: ['Hanya saat mandi pagi'],
      dentalPain: 'no'
    },
    oralAnalyses: [
      {
        imageBase64: '',
        analysisResult: {
          hygieneAssessment: 'Fair',
          issues: [
            {
              diseaseName: 'Dental caries on pit and fissure surface, limited to enamel',
              description: 'Bercak putih kapur (white spot lesion) pada fissure gigi premolar atas.',
              boundingBox: { x: 50, y: 35, width: 15, height: 15 }
            }
          ]
        }
      }
    ],
    healthReport: {
      nutritionResult: 'Needs Referral',
      stuntingStatus: 'Pendek (Stunted)',
      heightForAgeZScore: -2.45,
      weightStatus: 'Normal',
      weightForAgeZScore: -1.35,
      wastingStatus: 'Normal',
      wastingZScore: -0.65,
      lilaStatus: 'Normal',
      growthStatus: 'Perawakan Pendek',
      bmi: 14.4,
      bmiStatus: 'Normal',
      nutritionReason: 'TB/U Z-Score -2.45 SD menunjukkan defisit pertumbuhan linier kronis.',
      oralResult: 'At Risk of Caries',
      oralReason: 'Karies tahap awal pada email akibat kebiasaan minum teh manis dan susu botol menjelang tidur.',
      conclusion: 'Risiko karies dini teridentifikasi, perlu pencegahan agar tidak berkembang menjadi karies kavitas.',
      recommendations: [
        'Aplikasi topikal fluoride varnish oleh dokter gigi.',
        'Hentikan pemberian botol susu saat tidur.',
        'Konsumsi makanan kaya mikronutrien (Zat Besi dan Zinc) untuk mengejar pertumbuhan.'
      ]
    }
  },
  {
    id: 'ORL-2024-004',
    date: '2024-11-18T11:00:00.000Z',
    patientData: {
      nik: '3578011204220002',
      name: 'Muhammad Rayhan',
      dob: '2022-04-12',
      gender: 'Male',
      weight: '12.4',
      height: '91.0',
      headCircumference: '48.2',
      armCircumference: '14.5',
    },
    stuntingData: {
      ageGroup: '>24',
      exclusiveBreastfeeding: 'yes',
      sugarInFormula: 'no',
      mpasiStartDate: '6',
      mpasiMenu: ['Nasi tim', 'Ikan gabus', 'Sayur bayam'],
      mpasiTexture: 'Padat',
      snackFrequency: '1-2x',
      snackType: 'Buah pepaya & pisang',
      sweetDrinkFrequency: 'Tidak pernah',
      sleepWithBottle: 'no',
      gumCleaningStartDate: '6',
      useSpecialToothpaste: 'yes',
      mainMealsPerDay: '3x',
      dailyDietIncludes: ['Nasi', 'Ikan', 'Daging', 'Sayuran', 'Buah'],
      isPickyEater: 'no',
      pickyEaterFoods: '',
      snackFrequencyOutside: 'Jarang',
      favoriteSnack: 'Buah naga',
      weeklyConsumption: {
        soda: 'Tidak pernah',
        packagedSnacks: 'Jarang',
        sweets: 'Jarang',
        fastFood: 'Tidak pernah'
      },
      brushingFrequency: '2x sehari',
      brushingHabits: ['Didampingi orang tua secara rutin'],
      dentalPain: 'no'
    },
    oralAnalyses: [
      {
        imageBase64: '',
        analysisResult: {
          hygieneAssessment: 'Good',
          issues: []
        }
      }
    ],
    healthReport: {
      nutritionResult: 'Normal',
      stuntingStatus: 'Normal (Tinggi Sesuai Usia)',
      heightForAgeZScore: -0.42,
      weightStatus: 'Normal (Gizi Baik)',
      weightForAgeZScore: 0.15,
      wastingStatus: 'Normal (Gizi Baik)',
      wastingZScore: 0.35,
      lilaStatus: 'Normal',
      growthStatus: 'Tinggi Badan Sesuai Usia',
      bmi: 15.0,
      bmiStatus: 'Normal',
      nutritionReason: 'Seluruh kurva pertumbuhan berada pada rentang ideal WHO (Z-score -0.42 SD).',
      oralResult: 'Healthy',
      oralReason: 'Tidak terdeteksi karies, gingivitis, maupun lesi jaringan lunak mulut. Kebersihan mulut sangat baik.',
      conclusion: 'Status pertumbuhan fisik dan kesehatan rongga mulut optimal.',
      recommendations: [
        'Pertahankan pola asuh dan diet gizi seimbang.',
        'Pemeriksaan rutin berkala tiap 6 bulan ke dokter gigi.',
        'Pantau tumbuh kembang di Posyandu.'
      ]
    }
  },
  {
    id: 'ORL-2024-005',
    date: '2024-11-25T14:20:00.000Z',
    patientData: {
      nik: '3578015507230004',
      name: 'Aisyah Nur Salsabila',
      dob: '2023-07-10',
      gender: 'Female',
      weight: '9.6',
      height: '79.0',
      headCircumference: '45.8',
      armCircumference: '14.2',
    },
    stuntingData: {
      ageGroup: '0-24',
      exclusiveBreastfeeding: 'yes',
      sugarInFormula: 'no',
      mpasiStartDate: '6',
      mpasiMenu: ['Bubur labu kuning', 'Hati ayam', 'Minyak kelapa'],
      mpasiTexture: 'Lumat kental',
      snackFrequency: '1x',
      snackType: 'Alpukat tumbuk',
      sweetDrinkFrequency: 'Tidak pernah',
      sleepWithBottle: 'no',
      gumCleaningStartDate: '4',
      useSpecialToothpaste: 'no',
      mainMealsPerDay: '3x',
      dailyDietIncludes: ['ASI', 'Protein hewani'],
      isPickyEater: 'no',
      pickyEaterFoods: '',
      snackFrequencyOutside: 'Tidak pernah',
      favoriteSnack: 'Alpukat',
      weeklyConsumption: {
        soda: 'Tidak pernah',
        packagedSnacks: 'Tidak pernah',
        sweets: 'Tidak pernah',
        fastFood: 'Tidak pernah'
      },
      brushingFrequency: '2x sehari',
      brushingHabits: ['Pembersihan gusi dengan kasa steril'],
      dentalPain: 'no'
    },
    oralAnalyses: [
      {
        imageBase64: '',
        analysisResult: {
          hygieneAssessment: 'Good',
          issues: []
        }
      }
    ],
    healthReport: {
      nutritionResult: 'Normal',
      stuntingStatus: 'Normal (Tinggi Sesuai Usia)',
      heightForAgeZScore: 0.18,
      weightStatus: 'Normal',
      weightForAgeZScore: 0.32,
      wastingStatus: 'Normal',
      wastingZScore: 0.22,
      lilaStatus: 'Normal',
      growthStatus: 'Tinggi Badan Sesuai Usia',
      bmi: 15.4,
      bmiStatus: 'Normal',
      nutritionReason: 'Panjang badan menurut umur optimal (Z-Score +0.18 SD). Pola MPASI kaya protein hewani terlaksana dengan sangat baik.',
      oralResult: 'Healthy',
      oralReason: 'Jaringan mukosa dan gigi erupsi bersih tanpa tanda-tanda demineralisasi.',
      conclusion: 'Pertumbuhan optimal, bebas risiko stunting dan karies.',
      recommendations: [
        'Lanjutkan pemberian ASI hingga 2 tahun disertai MPASI bergizi seimbang.',
        'Mulai perkenalkan sikat gigi berbulu halus khusus bayi.',
        'Kontrol rutin posyandu setiap bulan.'
      ]
    }
  }
];
